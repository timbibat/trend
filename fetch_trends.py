import json
import requests
import xml.etree.ElementTree as ET

def fetch_google_trends():
    # We fetch Google's Daily Trends RSS Feed (Free, unblocked, no API keys needed!)
    url = "https://trends.google.com/trending/rss?geo=US"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    try:
        response = requests.get(url, headers=headers)
        root = ET.fromstring(response.text)
        
        trends_list = []
        # Find all trending items in the XML feed
        for index, item in enumerate(root.findall('.//item')[:8]): # Take top 8 trends
            title = item.find('title').text
            approx_traffic = item.find('{https://trends.google.com/trending/rss}approx_traffic').text
            description = f"Currently blowing up on Google Search with over {approx_traffic} searches today."
            
            # Map it to match your frontend website layout structure
            trends_list.append({
                "id": index + 1,
                "category": "Search Trend",
                "title": title,
                "growth": f"+{approx_traffic}",
                "description": description
            })
            
        # Save it directly into a data.json file
        with open('data.json', 'w') as f:
            json.dump(trends_list, f, indent=4)
        print("✅ Success! data.json has been updated with fresh trends.")
            
    except Exception as e:
        print(f"❌ Error fetching trends: {e}")

if __name__ == "__main__":
    fetch_google_trends()