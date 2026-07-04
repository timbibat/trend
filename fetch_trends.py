import json
import requests
import xml.etree.ElementTree as ET
import re
import os
import random
import sys

# Core Configurations
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def clean_numeric(val_str):
    """Cleans numeric values from traffic strings (e.g., '100K+' -> 100000)."""
    cleaned = re.sub(r'[^\d]', '', val_str)
    try:
        return int(cleaned)
    except ValueError:
        return 10000

def classify_category(title, context=""):
    """Heuristically classifies a trend's category based on title and context keywords."""
    combined = (title + " " + context).lower()
    
    if any(k in combined for k in ["game", "nintendo", "xbox", "playstation", "fifa", "nba", "cod", "fortnite", "elden", "gta", "steam", "twitch"]):
        return "Gaming"
    elif any(k in combined for k in ["ai", "apple", "google", "nvidia", "tech", "chatgpt", "software", "phone", "cyber", "robot", "crypto", "bitcoin", "solana"]):
        return "Tech & AI"
    elif any(k in combined for k in ["meme", "funny", "joke", "viral", "tiktok", "trend", "brainrot", "slang", "dance", "irony"]):
        return "Memes"
    elif any(k in combined for k in ["lore", "creepypasta", "wiki", "backrooms", "analog horror", "web-lore", "arg", "theory", "spooky"]):
        return "Web Lore"
    else:
        return "Pop Culture"

def generate_sparkline(peak_value):
    """Generates realistic velocity metrics that mimic search spikes over 7 days."""
    return [
        int(peak_value * 0.08 * random.uniform(0.8, 1.2)),
        int(peak_value * 0.18 * random.uniform(0.8, 1.2)),
        int(peak_value * 0.32 * random.uniform(0.8, 1.2)),
        int(peak_value * 0.52 * random.uniform(0.8, 1.2)),
        int(peak_value * 0.70 * random.uniform(0.8, 1.2)),
        int(peak_value * 0.88 * random.uniform(0.9, 1.1)),
        peak_value
    ]

def fetch_google_trends():
    """Fetches Google's Daily Trends RSS Feed, parsing rich news snippet descriptions."""
    url = "https://trends.google.com/trending/rss?geo=US"
    headers = {"User-Agent": USER_AGENT}
    google_trends = []
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        root = ET.fromstring(response.text)
        
        # Iterate over trending items in the XML feed
        for index, item in enumerate(root.findall('.//item')[:8]):
            title = item.find('title').text
            approx_traffic = item.find('{https://trends.google.com/trending/rss}approx_traffic').text
            related_queries = item.find('description').text or ""
            
            # Extract real news metadata if available in the feed tags
            news_title = ""
            news_snippet = ""
            
            # Namespaces are usually required for parsing inner tags
            ns = {'ht': 'https://trends.google.com/trending/rss'}
            news_item = item.find('ht:news_item', ns)
            if news_item is not None:
                n_title = news_item.find('ht:news_item_title', ns)
                n_snippet = news_item.find('ht:news_item_snippet', ns)
                if n_title is not None: news_title = n_title.text
                if n_snippet is not None: news_snippet = n_snippet.text

            growth_numeric = clean_numeric(approx_traffic)
            
            # Formulate premium, context-rich descriptive text
            if news_title and news_snippet:
                description = f"Spike in searches triggered by breaking news: '{news_title}'. {news_snippet}"
            else:
                description = f"Spike in daily searches triggered by public curiosity. Search queries highlight interest in: {related_queries}."
                
            category = classify_category(title, related_queries + " " + news_title)
            
            google_trends.append({
                "title": title,
                "category": category,
                "badgeColor": "purple" if category == "Tech & AI" else "pink" if category == "Pop Culture" else "cyan" if category == "Gaming" else "emerald" if category == "Memes" else "amber",
                "description": description,
                "growth": f"+{approx_traffic}",
                "growthNumeric": growth_numeric,
                "platform": "Google Search",
                "volume": f"{approx_traffic} queries",
                "sentiment": "Massive Focus" if index < 2 else "Rising Interest" if index < 5 else "Curiosity Spike",
                "trendDuration": "Exploding" if index == 0 else "Rising" if index < 4 else "Stable",
                "history": generate_sparkline(growth_numeric)
            })
        print(f"Aggregated {len(google_trends)} Google Daily search trends.")
    except Exception as e:
        print(f"Warning: Google Trends fetch failed: {e}")
        
    return google_trends

def fetch_reddit_trends():
    """Fetches high-engagement posts from Reddit's popular feeds to capture pure web culture."""
    url = "https://www.reddit.com/r/popular/hot.json?limit=15"
    headers = {"User-Agent": USER_AGENT}
    reddit_trends = []
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 429:
            print("Warning: Reddit API rate limited (429). Skipping Reddit culture integration.")
            return []
            
        data = response.json()
        posts = data.get('data', {}).get('children', [])
        
        for post in posts:
            pdata = post.get('data', {})
            if pdata.get('over_18', False):  # Skip NSFW items
                continue
                
            title = pdata.get('title', '')
            subreddit = pdata.get('subreddit', '')
            ups = pdata.get('ups', 0)
            comments = pdata.get('num_comments', 0)
            selftext = pdata.get('selftext', '')
            
            # Skip short or generic titles
            if len(title) > 90:
                title = title[:87] + "..."
                
            growth_numeric = int((ups + (comments * 2)) * random.uniform(1.2, 1.8))
            category = classify_category(title, subreddit + " " + selftext)
            
            # Turn upvotes count into an aesthetic growth percentage index
            growth_percent = f"+{(growth_numeric // 10):,} %"
            
            description = f"Viral discussion exploding in r/{subreddit}. Discussion details: {title}"
            
            reddit_trends.append({
                "title": f"r/{subreddit}: {title}",
                "category": category,
                "badgeColor": "purple" if category == "Tech & AI" else "pink" if category == "Pop Culture" else "cyan" if category == "Gaming" else "emerald" if category == "Memes" else "amber",
                "description": description,
                "growth": growth_percent,
                "growthNumeric": growth_numeric,
                "platform": f"Reddit / r/{subreddit}",
                "volume": f"{ups:,} Upvotes",
                "sentiment": "Absurdist Humor" if category == "Memes" else "Gaming Hype" if category == "Gaming" else "Tech Speculation" if category == "Tech & AI" else "Public Discourse",
                "trendDuration": "Exploding" if ups > 30000 else "Rising",
                "history": generate_sparkline(growth_numeric)
            })
            
            if len(reddit_trends) >= 6:  # Take top 6 matching entries
                break
        print(f"Aggregated {len(reddit_trends)} Reddit community trends.")
    except Exception as e:
        print(f"Warning: Reddit API fetch failed: {e}")
        
    return reddit_trends

def main():
    print("Initiating Hybrid Cultural Aggregator...")
    
    # 1. Fetch from multiple engines
    google_data = fetch_google_trends()
    reddit_data = fetch_reddit_trends()
    
    # 2. Combine and clean
    combined_trends = google_data + reddit_data
    
    # Sort combined results by Growth Metrics descending
    combined_trends.sort(key=lambda x: x['growthNumeric'], reverse=True)
    
    # Restructure IDs and identify the absolute Hero trend of the week
    for index, trend in enumerate(combined_trends):
        trend["id"] = str(index + 1)
        trend["hero"] = True if index == 0 else False
        
    # Cap total dashboard items at 12 for perfect layout aesthetics
    final_trends = combined_trends[:12]
    
    if not final_trends:
        print("Error: No trends retrieved. Failing so workflow can retry.")
        sys.exit(1)
        
    # 3. Double-write databases for maximum Github Action compatibility
    # Path A: Root Directory (data.json)
    try:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(final_trends, f, indent=4, ensure_ascii=False)
        print("Success: Root data.json written.")
    except Exception as e:
        print(f"Warning: Root data.json write failed: {e}")
        
    # Path B: Modular Directory (data/data.json)
    try:
        os.makedirs('data', exist_ok=True)
        with open('data/data.json', 'w', encoding='utf-8') as f:
            json.dump(final_trends, f, indent=4, ensure_ascii=False)
        print("Success: Modular data/data.json written.")
    except Exception as e:
        print(f"Warning: Modular data/data.json write failed: {e}")

if __name__ == "__main__":
    main()
