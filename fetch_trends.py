import json
import requests
import xml.etree.ElementTree as ET
import re
import os

def fetch_google_trends():
    # We fetch Google's Daily Trends RSS Feed (Free, unblocked, no API keys needed!)
    url = "https://trends.google.com/trending/rss?geo=US"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    # Categories list supported by the frontend accent mapping
    categories = ["Pop Culture", "Tech & AI", "Gaming", "Memes", "Web Lore"]
    sentiments = ["Hype Spiking", "Curious Focus", "Massive Engagement", "Speculative", "Analytical Interest"]
    
    try:
        response = requests.get(url, headers=headers)
        root = ET.fromstring(response.text)
        
        trends_list = []
        # Find all trending items in the XML feed
        for index, item in enumerate(root.findall('.//item')[:8]): # Take top 8 trends
            title = item.find('title').text
            approx_traffic = item.find('{https://trends.google.com/trending/rss}approx_traffic').text
            related_queries = item.find('description').text or ""
            
            # Clean numeric growth calculation for sorting on the frontend
            traffic_clean = re.sub(r'[^\d]', '', approx_traffic)
            try:
                growth_numeric = int(traffic_clean)
            except ValueError:
                growth_numeric = 50000
                
            # Classify category dynamically based on keywords in title/related queries
            title_lower = (title + " " + related_queries).lower()
            if any(k in title_lower for k in ["game", "nintendo", "xbox", "playstation", "fifa", "nba", "cod", "fortnite"]):
                category = "Gaming"
            elif any(k in title_lower for k in ["ai", "apple", "google", "nvidia", "tech", "chatgpt", "software", "phone"]):
                category = "Tech & AI"
            elif any(k in title_lower for k in ["meme", "funny", "joke", "viral", "tiktok", "trend"]):
                category = "Memes"
            elif any(k in title_lower for k in ["lore", "reddit", "creepypasta", "wiki", "backrooms"]):
                category = "Web Lore"
            else:
                # Distribute evenly across categories as fallback
                category = categories[index % len(categories)]
                
            # Formulate a premium, highly contextual description
            description = f"Spike in daily searches triggered by public curiosity. Search queries highlight interest in: {related_queries}."
            
            # Generate simulated historical trends ending at growth_numeric
            history = [
                int(growth_numeric * 0.1),
                int(growth_numeric * 0.22),
                int(growth_numeric * 0.38),
                int(growth_numeric * 0.55),
                int(growth_numeric * 0.72),
                int(growth_numeric * 0.88),
                growth_numeric
            ]
            
            # Map it to perfectly match the premium frontend database model
            trends_list.append({
                "id": str(index + 1),
                "title": title,
                "category": category,
                "badgeColor": "purple" if category == "Tech & AI" else "pink" if category == "Pop Culture" else "cyan" if category == "Gaming" else "emerald" if category == "Memes" else "amber",
                "description": description,
                "growth": f"+{approx_traffic}",
                "growthNumeric": growth_numeric,
                "platform": "Google Search",
                "volume": f"{approx_traffic} queries",
                "sentiment": sentiments[index % len(sentiments)],
                "trendDuration": "Exploding" if index == 0 else "Rising" if index < 4 else "Stable",
                "history": history,
                "hero": True if index == 0 else False
            })
            
        # Target the correct modular directory data/data.json
        os.makedirs('data', exist_ok=True)
        with open('data/data.json', 'w', encoding='utf-8') as f:
            json.dump(trends_list, f, indent=4, ensure_ascii=False)
        print("Success! data/data.json has been updated with fresh, schema-compliant trends.")
            
    except Exception as e:
        print(f"Error fetching trends: {e}")

if __name__ == "__main__":
    fetch_google_trends()