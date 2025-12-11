"""
Simple Ad Campaign Manager for Marketing Agent
"""
import random
from datetime import datetime
from dataclasses import dataclass
from typing import Optional


@dataclass
class Ad:
    id: str
    title: str
    content: str
    target_audience: str
    budget: float
    impressions: int = 0
    clicks: int = 0

    @property
    def ctr(self) -> float:
        """Click-through rate"""
        if self.impressions == 0:
            return 0.0
        return (self.clicks / self.impressions) * 100

    @property
    def cpc(self) -> float:
        """Cost per click"""
        if self.clicks == 0:
            return 0.0
        return self.budget / self.clicks


class AdCampaignManager:
    def __init__(self):
        self.ads: dict[str, Ad] = {}
        self.active_campaign: Optional[str] = None

    def create_ad(self, ad_id: str, title: str, content: str,
                  target_audience: str, budget: float) -> Ad:
        ad = Ad(
            id=ad_id,
            title=title,
            content=content,
            target_audience=target_audience,
            budget=budget
        )
        self.ads[ad_id] = ad
        return ad

    def serve_ad(self, ad_id: str) -> dict:
        """Serve an ad and record an impression"""
        if ad_id not in self.ads:
            raise ValueError(f"Ad {ad_id} not found")

        ad = self.ads[ad_id]
        ad.impressions += 1

        return {
            "ad_id": ad.id,
            "title": ad.title,
            "content": ad.content,
            "served_at": datetime.now().isoformat()
        }

    def record_click(self, ad_id: str) -> None:
        """Record a click on an ad"""
        if ad_id not in self.ads:
            raise ValueError(f"Ad {ad_id} not found")
        self.ads[ad_id].clicks += 1

    def get_stats(self, ad_id: str) -> dict:
        """Get performance stats for an ad"""
        if ad_id not in self.ads:
            raise ValueError(f"Ad {ad_id} not found")

        ad = self.ads[ad_id]
        return {
            "ad_id": ad.id,
            "title": ad.title,
            "impressions": ad.impressions,
            "clicks": ad.clicks,
            "ctr": f"{ad.ctr:.2f}%",
            "cpc": f"${ad.cpc:.2f}"
        }

    def select_best_ad(self, audience: str) -> Optional[Ad]:
        """Select the best performing ad for a target audience"""
        matching_ads = [
            ad for ad in self.ads.values()
            if ad.target_audience == audience
        ]
        if not matching_ads:
            return None
        return max(matching_ads, key=lambda a: a.ctr)


if __name__ == "__main__":
    # Demo
    manager = AdCampaignManager()

    # Create sample ads
    manager.create_ad(
        ad_id="ad_001",
        title="Summer Sale!",
        content="Get 50% off on all items. Limited time offer!",
        target_audience="shoppers",
        budget=1000.0
    )

    manager.create_ad(
        ad_id="ad_002",
        title="New Product Launch",
        content="Introducing our revolutionary new product.",
        target_audience="tech_enthusiasts",
        budget=2000.0
    )

    # Simulate ad serving and clicks
    for _ in range(100):
        manager.serve_ad("ad_001")
        if random.random() < 0.05:  # 5% click rate
            manager.record_click("ad_001")

    for _ in range(50):
        manager.serve_ad("ad_002")
        if random.random() < 0.08:  # 8% click rate
            manager.record_click("ad_002")

    # Print stats
    print("=== Ad Campaign Stats ===")
    print(manager.get_stats("ad_001"))
    print(manager.get_stats("ad_002"))
