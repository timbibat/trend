import json
import requests
import xml.etree.ElementTree as ET
import re
import os
import random
import urllib.parse
from datetime import datetime, timezone

# Browser Agent
USER_AGENT_BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
USER_AGENT_REDDIT = "web:TrendPulseAggregator:v2.0 (by /u/timbibat)"

def clean_numeric(val_str):
    """Cleans numeric values from traffic strings (e.g., '100K+' -> 100000)."""
    cleaned = re.sub(r'[^\d]', '', str(val_str))
    try:
        return int(cleaned)
    except ValueError:
        return 10000

def classify_category(title, context=""):
    """Heuristically classifies a trend's category based on title and context keywords."""
    combined = (title + " " + context).lower()
    
    if any(k in combined for k in ["game", "nintendo", "xbox", "playstation", "fifa", "nba", "cod", "fortnite", "elden", "gta", "steam", "twitch", "esports", "zelda", "pokemon"]):
        return "Gaming"
    elif any(k in combined for k in ["ai", "apple", "google", "nvidia", "tech", "chatgpt", "software", "phone", "cyber", "robot", "crypto", "bitcoin", "solana", "linux", "cloud", "llm"]):
        return "Tech & AI"
    elif any(k in combined for k in ["meme", "funny", "joke", "viral", "tiktok", "trend", "brainrot", "slang", "dance", "irony", "shitpost", "humor"]):
        return "Memes"
    elif any(k in combined for k in ["lore", "creepypasta", "wiki", "backrooms", "analog horror", "web-lore", "arg", "theory", "spooky", "mystery"]):
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
    """Fetches Google Daily Trends RSS Feed across multiple regions for diverse cultural coverage."""
    geos = ["US", "GB", "CA", "AU"]
    headers = {"User-Agent": USER_AGENT_BROWSER}
    google_trends = []
    seen_titles = set()
    
    for geo in geos:
        url = f"https://trends.google.com/trending/rss?geo={geo}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                continue
            root = ET.fromstring(response.text)
            
            for item in root.findall('.//item'):
                title_elem = item.find('title')
                if title_elem is None or not title_elem.text:
                    continue
                title = title_elem.text.strip()
                
                # Deduplicate across regions
                if title.lower() in seen_titles:
                    continue
                seen_titles.add(title.lower())
                
                traffic_elem = item.find('{https://trends.google.com/trending/rss}approx_traffic')
                approx_traffic = traffic_elem.text if traffic_elem is not None else "10K+"
                desc_elem = item.find('description')
                related_queries = (desc_elem.text or "") if desc_elem is not None else ""
                
                news_title = ""
                news_snippet = ""
                news_url = ""
                ns = {'ht': 'https://trends.google.com/trending/rss'}
                news_item = item.find('ht:news_item', ns)
                if news_item is not None:
                    n_title = news_item.find('ht:news_item_title', ns)
                    n_snippet = news_item.find('ht:news_item_snippet', ns)
                    n_url = news_item.find('ht:news_item_url', ns)
                    if n_title is not None and n_title.text: news_title = n_title.text
                    if n_snippet is not None and n_snippet.text: news_snippet = n_snippet.text
                    if n_url is not None and n_url.text: news_url = n_url.text

                growth_numeric = clean_numeric(approx_traffic)
                
                if news_title and news_snippet:
                    description = f"Spike in searches triggered by breaking news: '{news_title}'. {news_snippet}"
                else:
                    description = f"Spike in daily searches triggered by public curiosity. Search queries highlight interest in: {related_queries}."
                    
                category = classify_category(title, related_queries + " " + news_title)
                index = len(google_trends)
                
                source_url = news_url if news_url else f"https://www.google.com/search?q={urllib.parse.quote_plus(title)}"

                google_trends.append({
                    "title": title,
                    "category": category,
                    "badgeColor": "purple" if category == "Tech & AI" else "pink" if category == "Pop Culture" else "cyan" if category == "Gaming" else "emerald" if category == "Memes" else "amber",
                    "description": description,
                    "growth": f"+{approx_traffic}",
                    "growthNumeric": growth_numeric,
                    "platform": f"Google Search ({geo})",
                    "geo": geo,
                    "volume": f"{approx_traffic} queries",
                    "sentiment": "Massive Focus" if index < 2 else "Rising Interest" if index < 5 else "Curiosity Spike",
                    "trendDuration": "Exploding" if index == 0 else "Rising" if index < 6 else "Stable",
                    "history": generate_sparkline(growth_numeric),
                    "url": source_url
                })
                
                if len(google_trends) >= 12:
                    break
            if len(google_trends) >= 12:
                break
        except Exception as e:
            print(f"Warning: Google Trends fetch failed for {geo}: {e}")
            
    print(f"Aggregated {len(google_trends)} Google Daily search trends.")
    return google_trends

def fetch_hackernews_trends():
    """Fetches high-velocity tech and software discussions from Hacker News."""
    hn_trends = []
    try:
        top_url = "https://hacker-news.firebaseio.com/v0/topstories.json"
        response = requests.get(top_url, timeout=10)
        if response.status_code != 200:
            return []
        ids = response.json()[:10]
        
        for item_id in ids:
            item_url = f"https://hacker-news.firebaseio.com/v0/item/{item_id}.json"
            res = requests.get(item_url, timeout=10)
            if res.status_code != 200:
                continue
            item = res.json()
            if not item or item.get('type') != 'story':
                continue
                
            title = item.get('title', '')
            score = item.get('score', 100)
            comments = item.get('descendants', 0)
            item_link = item.get('url') or f"https://news.ycombinator.com/item?id={item_id}"
            
            growth_numeric = int((score * 15 + comments * 25) * random.uniform(1.1, 1.5))
            growth_percent = f"+{(growth_numeric // 10):,} %"
            category = "Tech & AI"
            description = f"Viral technology breakout on Hacker News with {score} points and {comments} community comments."
            
            hn_trends.append({
                "title": title,
                "category": category,
                "badgeColor": "purple",
                "description": description,
                "growth": growth_percent,
                "growthNumeric": growth_numeric,
                "platform": "Hacker News",
                "geo": "GLOBAL",
                "volume": f"{score} Points",
                "sentiment": "Tech Speculation",
                "trendDuration": "Rising",
                "history": generate_sparkline(growth_numeric),
                "url": item_link
            })
            
            if len(hn_trends) >= 5:
                break
        print(f"Aggregated {len(hn_trends)} Hacker News tech trends.")
    except Exception as e:
        print(f"Warning: Hacker News fetch failed: {e}")
        
    return hn_trends

def fetch_steam_trends():
    """Fetches high-velocity trending and featured video games from Steam."""
    steam_trends = []
    try:
        url = "https://store.steampowered.com/api/featured/"
        headers = {"User-Agent": USER_AGENT_BROWSER}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return []
        
        data = response.json()
        games = data.get('featured_win', [])
        
        for game in games:
            name = game.get('name', '')
            game_id = game.get('id', '')
            if not name or not game_id:
                continue
                
            game_url = f"https://store.steampowered.com/app/{game_id}"
            growth_numeric = int(random.randint(12000, 48000))
            growth_percent = f"+{(growth_numeric // 10):,} %"
            
            steam_trends.append({
                "title": name,
                "category": "Gaming",
                "badgeColor": "cyan",
                "description": f"Featured gaming velocity spike on Steam Store. Trending global player interaction across PC platforms.",
                "growth": growth_percent,
                "growthNumeric": growth_numeric,
                "platform": "Steam Store",
                "geo": "GLOBAL",
                "volume": "Trending Release",
                "sentiment": "Gaming Hype",
                "trendDuration": "Exploding" if growth_numeric > 30000 else "Rising",
                "history": generate_sparkline(growth_numeric),
                "url": game_url
            })
            
            if len(steam_trends) >= 5:
                break
        print(f"Aggregated {len(steam_trends)} Steam gaming trends.")
    except Exception as e:
        print(f"Warning: Steam fetch failed: {e}")
    return steam_trends

def fetch_kym_trends():
    """Fetches viral meme lore and internet culture from Know Your Meme RSS feed."""
    kym_trends = []
    try:
        url = "https://knowyourmeme.com/memes.rss"
        headers = {"User-Agent": USER_AGENT_BROWSER}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return []
        root = ET.fromstring(response.text)
        
        for item in root.findall('.//item'):
            title_elem = item.find('title')
            link_elem = item.find('link')
            desc_elem = item.find('description')
            
            if title_elem is None or not title_elem.text:
                continue
            title = title_elem.text.strip()
            link = link_elem.text.strip() if link_elem is not None and link_elem.text else f"https://www.google.com/search?q={urllib.parse.quote_plus(title)}"
            desc = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else "Spike in viral spread across TikTok, Instagram, and web culture."
            # Clean HTML from description
            clean_desc = re.sub(r'<[^>]+>', '', desc)[:140]
            
            growth_numeric = int(random.randint(15000, 65000))
            growth_percent = f"+{(growth_numeric // 10):,} %"
            category = "Web Lore" if any(w in title.lower() for w in ["lore", "horror", "wiki", "creepypasta", "backrooms", "mystery"]) else "Memes"
            
            kym_trends.append({
                "title": title,
                "category": category,
                "badgeColor": "emerald" if category == "Memes" else "amber",
                "description": f"Breakout meme culture index: {clean_desc}",
                "growth": growth_percent,
                "growthNumeric": growth_numeric,
                "platform": "Know Your Meme",
                "geo": "GLOBAL",
                "volume": "Viral Spreading",
                "sentiment": "Absurdist Humor" if category == "Memes" else "Web Mystery",
                "trendDuration": "Exploding" if growth_numeric > 40000 else "Rising",
                "history": generate_sparkline(growth_numeric),
                "url": link
            })
            
            if len(kym_trends) >= 6:
                break
        print(f"Aggregated {len(kym_trends)} Know Your Meme culture trends.")
    except Exception as e:
        print(f"Warning: Know Your Meme fetch failed: {e}")
    return kym_trends

def fetch_reddit_sub(sub_url, default_category=None, limit=4):
    """Helper to fetch from a specific Reddit JSON endpoint if accessible."""
    headers = {"User-Agent": USER_AGENT_REDDIT}
    trends = []
    try:
        response = requests.get(sub_url, headers=headers, timeout=5)
        if response.status_code != 200:
            return []
        data = response.json()
        posts = data.get('data', {}).get('children', [])
        
        for post in posts:
            pdata = post.get('data', {})
            if pdata.get('over_18', False) or pdata.get('stickied', False):
                continue
                
            title = pdata.get('title', '')
            subreddit = pdata.get('subreddit', '')
            ups = pdata.get('ups', 0)
            comments = pdata.get('num_comments', 0)
            selftext = pdata.get('selftext', '')
            permalink = pdata.get('permalink', '')
            
            if len(title) > 90:
                title = title[:87] + "..."
                
            growth_numeric = int((ups + (comments * 2)) * random.uniform(1.2, 1.8))
            category = default_category if default_category else classify_category(title, subreddit + " " + selftext)
            growth_percent = f"+{(growth_numeric // 10):,} %"
            description = f"Viral discussion exploding in r/{subreddit}. Topic: {title}"
            post_url = f"https://www.reddit.com{permalink}" if permalink else f"https://www.reddit.com/r/{subreddit}"
            
            trends.append({
                "title": f"r/{subreddit}: {title}",
                "category": category,
                "badgeColor": "purple" if category == "Tech & AI" else "pink" if category == "Pop Culture" else "cyan" if category == "Gaming" else "emerald" if category == "Memes" else "amber",
                "description": description,
                "growth": growth_percent,
                "growthNumeric": growth_numeric,
                "platform": f"Reddit / r/{subreddit}",
                "geo": "GLOBAL",
                "volume": f"{ups:,} Upvotes",
                "sentiment": "Absurdist Humor" if category == "Memes" else "Gaming Hype" if category == "Gaming" else "Public Discourse",
                "trendDuration": "Exploding" if ups > 25000 else "Rising",
                "history": generate_sparkline(growth_numeric),
                "url": post_url
            })
            if len(trends) >= limit:
                break
    except Exception:
        pass
    return trends

def load_cached_fallback():
    """Attempts to load existing data.json as a graceful fallback."""
    for path in ['data/data.json', 'data.json']:
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        print(f"Loaded {len(data)} cached trends from {path}.")
                        return data
            except Exception:
                pass
    return []

def main():
    print("Initiating Hybrid Cultural Aggregator...")
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # 1. Fetch from diverse culture and tech engines
    google_data = fetch_google_trends()
    hn_data = fetch_hackernews_trends()
    steam_data = fetch_steam_trends()
    kym_data = fetch_kym_trends()
    
    # Optional Reddit
    reddit_data = []
    try:
        reddit_data = fetch_reddit_sub("https://www.reddit.com/r/popular/hot.json?limit=8", None, 3)
    except Exception:
        pass
    
    # 2. Combine and clean
    combined_trends = google_data + hn_data + steam_data + kym_data + reddit_data
    
    # Graceful fallback if network feeds were limited or empty
    if not combined_trends:
        print("Live feeds unavailable. Attempting cache fallback...")
        combined_trends = load_cached_fallback()
        if not combined_trends:
            print("Fatal: No trends retrieved and no cache available.")
            exit(1)
    
    # Sort combined results by Growth Metrics descending
    combined_trends.sort(key=lambda x: x.get('growthNumeric', 0), reverse=True)
    
    # Restructure IDs, Hero designation, and timestamp
    for index, trend in enumerate(combined_trends):
        trend["id"] = str(index + 1)
        trend["hero"] = True if index == 0 else False
        trend["updatedAt"] = now_iso
        if "geo" not in trend:
            trend["geo"] = "GLOBAL"
        if "url" not in trend:
            trend["url"] = f"https://www.google.com/search?q={urllib.parse.quote_plus(trend.get('title', ''))}"
        
    # Cap total dashboard items at 28 for rich category representation
    final_trends = combined_trends[:28]
    
    # 3. Double-write databases for maximum compatibility
    try:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(final_trends, f, indent=4, ensure_ascii=False)
        print(f"Success: Root data.json written with {len(final_trends)} trends.")
    except Exception as e:
        print(f"Warning: Root data.json write failed: {e}")
        
    try:
        os.makedirs('data', exist_ok=True)
        with open('data/data.json', 'w', encoding='utf-8') as f:
            json.dump(final_trends, f, indent=4, ensure_ascii=False)
        print(f"Success: Modular data/data.json written with {len(final_trends)} trends.")
    except Exception as e:
        print(f"Warning: Modular data/data.json write failed: {e}")

if __name__ == "__main__":
    main()