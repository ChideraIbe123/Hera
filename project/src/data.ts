import {
  Globe,
  Briefcase,
  Microscope,
  Camera,
  Code,
  Heart,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "./components/AuthProvider";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const placeholderImages = [
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800", // news general
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800", // business
  "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800", // technology
  "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800", // science
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800", // health
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800", // culture
  "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=800", // politics
  "https://images.unsplash.com/photo-1522211988038-6fcbb8c12c7e?auto=format&fit=crop&w=800", // sports
  "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=800", // entertainment
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800", // space
];

const getRandomPlaceholder = () => {
  return placeholderImages[
    Math.floor(Math.random() * placeholderImages.length)
  ];
};

export async function getArticles() {
  const { data, error } = await supabase
    .from("Articles")
    .select(
      "id, title, link, snippet, time_scraped, source, created_at, image_url, query_term, grouping"
    );

  if (error) throw error;

  const shuffledData = data ? [...data].sort(() => Math.random() - 0.5) : [];

  // Calculate hours ago for each article
  const now = new Date();
  shuffledData.forEach((article) => {
    if (article.time_scraped && article.created_at) {
      // Parse the time_scraped string
      let timeOffset = 0;
      const timeStr = article.time_scraped.toLowerCase();

      if (timeStr.includes("live")) {
        // Extract minutes from "LIVE13 minutes ago" format
        const minutes = parseInt(timeStr.match(/\d+/)?.[0] || "0");
        timeOffset = minutes * 60 * 1000; // Convert to milliseconds
      } else if (timeStr.includes("minutes")) {
        const minutes = parseInt(timeStr.match(/\d+/)?.[0] || "0");
        timeOffset = minutes * 60 * 1000;
      } else if (timeStr.includes("hours")) {
        const hours = parseInt(timeStr.match(/\d+/)?.[0] || "0");
        timeOffset = hours * 60 * 60 * 1000;
      }

      // Get the actual scraped time by subtracting offset from created_at
      const createdDate = new Date(article.created_at);
      const scrapedDate = new Date(createdDate.getTime() - timeOffset);

      // Calculate time difference from now
      const diffMinutes = Math.floor(
        (now.getTime() - scrapedDate.getTime()) / (1000 * 60)
      );

      if (diffMinutes < 1) {
        (article as any).time = "LIVE";
      } else if (diffMinutes < 60) {
        (article as any).time = `LIVE${diffMinutes} minutes ago`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        (article as any).time = `${diffHours} hours ago`;
      }
    }
  });

  return (
    shuffledData.map((article) => ({
      id: article.id,
      title: article.title,
      image: article.image_url || getRandomPlaceholder(),
      link: article.link,
      time: (article as any).time, // Using the time constant calculated in the forEach loop above
      // category: article.category
    })) || []
  );
}

export async function getInsights() {
  const { data, error } = await supabase
    .from("Articles")
    .select(
      "id, title, link, snippet, time_scraped, source, created_at, image_url, query_term, grouping"
    );

  if (error) throw error;

  const groupedArticles = data.reduce(
    (acc: { [key: string]: any[] }, article) => {
      const group = article.grouping || "Other";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push({
        id: article.id,
        title: article.title,
        summary: article.snippet,
        image: article.image_url || getRandomPlaceholder(),
        link: article.link,
      });
      return acc;
    },
    {}
  );

  const topics = Object.entries(groupedArticles).map(
    ([name, stories], index) => ({
      id: index + 1,
      name: name,
      icon: [Globe, Briefcase, Microscope, Camera, Code, Heart][index % 6],
      color: ["blue", "green", "purple", "pink", "yellow", "red"][index % 6],
      stories: stories,
    })
  );

  return topics;
}

export async function getTailoredNews(user: any) {
  // Return empty array if no user
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("ranked_articles")
    .eq("user_id", user.id)
    .single();

  if (error) throw error;
  if (!data?.ranked_articles) {
    return [];
  }

  const articleIds = data.ranked_articles;

  // Get the full article information for each ranked article id
  const { data: articles, error: articlesError } = await supabase
    .from("Articles")
    .select(
      "id, title, link, snippet, time_scraped, source, created_at, image_url, query_term, grouping"
    )
    .in("id", articleIds);

  if (articlesError) throw articlesError;

  const sortedArticles =
    articles?.sort(
      (a, b) => articleIds.indexOf(a.id) - articleIds.indexOf(b.id)
    ) || [];

  const now = new Date();
  sortedArticles.forEach((article) => {
    if (article.time_scraped && article.created_at) {
      // Parse the time_scraped string
      let timeOffset = 0;
      const timeStr = article.time_scraped.toLowerCase();

      if (timeStr.includes("live")) {
        // Extract minutes from "LIVE13 minutes ago" format
        const minutes = parseInt(timeStr.match(/\d+/)?.[0] || "0");
        timeOffset = minutes * 60 * 1000; // Convert to milliseconds
      } else if (timeStr.includes("minutes")) {
        const minutes = parseInt(timeStr.match(/\d+/)?.[0] || "0");
        timeOffset = minutes * 60 * 1000;
      } else if (timeStr.includes("hours")) {
        const hours = parseInt(timeStr.match(/\d+/)?.[0] || "0");
        timeOffset = hours * 60 * 60 * 1000;
      }

      // Get the actual scraped time by subtracting offset from created_at
      const createdDate = new Date(article.created_at);
      const scrapedDate = new Date(createdDate.getTime() - timeOffset);

      // Calculate time difference from now
      const diffMinutes = Math.floor(
        (now.getTime() - scrapedDate.getTime()) / (1000 * 60)
      );

      if (diffMinutes < 1) {
        (article as any).time = "LIVE";
      } else if (diffMinutes < 60) {
        (article as any).time = `LIVE${diffMinutes} minutes ago`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        (article as any).time = `${diffHours} hours ago`;
      }
    }
  });

  return sortedArticles.map((article) => ({
    id: article.id,
    title: article.title,
    image: article.image_url || getRandomPlaceholder(),
    link: article.link,
    time: (article as any).time,
  }));
}

export const tailoredNews = [
  {
    id: 1,
    title: "AI Breakthrough in Medical Research",
    image:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800",
    category: "Technology",
  },
  {
    id: 2,
    title: "Space Exploration Makes New Discovery",
    image:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800",
    category: "Science",
  },
  {
    id: 3,
    title: "Global Climate Summit Results",
    image:
      "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?auto=format&fit=crop&w=800",
    category: "Environment",
  },
  {
    id: 4,
    title: "New Quantum Computing Milestone",
    image:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800",
    category: "Technology",
  },
];

export const popularNews = [
  {
    id: 1,
    title: "Major Sports Event Final Results",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800",
    views: "250K",
  },
  {
    id: 2,
    title: "Entertainment Industry Breakthrough",
    image:
      "https://images.unsplash.com/photo-1586899028174-e7098604235b?auto=format&fit=crop&w=800",
    views: "180K",
  },
  {
    id: 3,
    title: "Economic Market Update",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800",
    views: "150K",
  },
  {
    id: 4,
    title: "Tech Giant Announces New Product",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800",
    views: "120K",
  },
];

export const topics = [
  {
    id: 1,
    name: "World News",
    icon: Globe,
    color: "blue",
    stories: [
      {
        id: 1,
        title: "Global Summit Addresses Climate Change",
        summary:
          "World leaders gather to discuss urgent climate action and set new emission targets.",
        image:
          "https://images.unsplash.com/photo-1623177623442-979c1e42c255?auto=format&fit=crop&w=800",
      },
      {
        id: 2,
        title: "Peace Talks Progress in Middle East",
        summary:
          "Diplomatic breakthrough as nations agree to new framework for regional stability.",
        image:
          "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800",
      },
      {
        id: 3,
        title: "International Trade Agreement Signed",
        summary:
          "Major economies forge new partnership to boost global commerce and cooperation.",
        image:
          "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=800",
      },
    ],
  },
  {
    id: 2,
    name: "Business",
    icon: Briefcase,
    color: "green",
    stories: [
      {
        id: 1,
        title: "Tech Startup Reaches Unicorn Status",
        summary:
          "Revolutionary AI platform attracts major investment, valued at over $1 billion.",
        image:
          "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=800",
      },
      {
        id: 2,
        title: "Market Rally Continues",
        summary:
          "Global stocks hit new highs as economic recovery gains momentum.",
        image:
          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800",
      },
      {
        id: 3,
        title: "New Cryptocurrency Regulations",
        summary:
          "Government announces framework for digital currency oversight.",
        image:
          "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800",
      },
    ],
  },
  {
    id: 3,
    name: "Science",
    icon: Microscope,
    color: "purple",
    stories: [
      {
        id: 1,
        title: "Mars Mission Discovers Water Evidence",
        summary:
          "Latest rover findings suggest presence of ancient water sources on Mars.",
        image:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800",
      },
      {
        id: 2,
        title: "Breakthrough in Quantum Computing",
        summary: "Scientists achieve new milestone in quantum supremacy.",
        image:
          "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800",
      },
      {
        id: 3,
        title: "New Species Discovered",
        summary:
          "Researchers find previously unknown species in Amazon rainforest.",
        image:
          "https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=800",
      },
    ],
  },
  {
    id: 4,
    name: "Entertainment",
    icon: Camera,
    color: "pink",
    stories: [
      {
        id: 1,
        title: "Blockbuster Movie Breaks Records",
        summary:
          "Latest superhero film surpasses box office expectations worldwide.",
        image:
          "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800",
      },
      {
        id: 2,
        title: "Music Festival Announces Lineup",
        summary:
          "Major artists set to perform at summer's biggest music event.",
        image:
          "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800",
      },
      {
        id: 3,
        title: "Streaming Platform Launch",
        summary: "New streaming service debuts with exclusive content lineup.",
        image:
          "https://images.unsplash.com/photo-1586899028174-e7098604235b?auto=format&fit=crop&w=800",
      },
    ],
  },
  {
    id: 5,
    name: "Technology",
    icon: Code,
    color: "indigo",
    stories: [
      {
        id: 1,
        title: "AI Assistant Breaks Language Barrier",
        summary: "New AI model achieves human-level translation accuracy.",
        image:
          "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800",
      },
      {
        id: 2,
        title: "5G Network Expansion",
        summary: "Major cities complete 5G infrastructure rollout.",
        image:
          "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800",
      },
      {
        id: 3,
        title: "Electric Vehicle Breakthrough",
        summary: "New battery technology promises 1000-mile range.",
        image:
          "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800",
      },
    ],
  },
  {
    id: 6,
    name: "Health",
    icon: Heart,
    color: "red",
    stories: [
      {
        id: 1,
        title: "New Cancer Treatment Success",
        summary: "Clinical trials show promising results for targeted therapy.",
        image:
          "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800",
      },
      {
        id: 2,
        title: "Mental Health Innovation",
        summary: "Digital therapy platform shows positive outcomes in study.",
        image:
          "https://images.unsplash.com/photo-1527137342181-19aab11a8ee8?auto=format&fit=crop&w=800",
      },
      {
        id: 3,
        title: "Fitness Trend Analysis",
        summary: "Research reveals most effective exercise routines.",
        image:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800",
      },
    ],
  },
];
