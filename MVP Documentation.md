Sri Lanka Multi-Source News Summarizer – MVP Documentation
1. Product Overview
Problem Statement: Sri Lankan news consumers face information overload and distrust in media. With dozens of outlets across English, Sinhala, and Tamil, it’s time-consuming to scan multiple sources for facts. Diaspora and busy locals struggle to “know what’s happening back home” without hopping between sitesreddit.com. Trust is low: 87% of Sri Lankan journalists themselves believe local media fails to provide accurate, balanced informationcpalanka.org. Over half of news stories rely on a single sourcecpalanka.org, leading to one-sided narratives. Misinformation and sensationalism further erode confidence.
Why Existing Platforms Fall Short: Traditional news platforms and aggregators haven’t solved these issues. Many Sri Lankan news sites are partisan or focus on one language, leaving gaps for those not fluent in it. Global aggregators like Google News often overlook smaller local sources or context, favoring international outlets over local reportagemedium.com. This means important local perspectives (e.g. a provincial incident) might get drowned out by bigger outlets that lack on-ground detailmedium.com. Existing local aggregators simply list headlines, forcing users to filter duplicates and biases themselves. As Feedly’s engineers note, it’s “painful to filter through duplicate stories manually” on typical aggregatorsfeedly.com. There is no single platform that synthesizes verified facts from multiple Sri Lankan sources into one neutral, concise story.
Core Value Proposition: Our product delivers clarity, neutrality, and trust in news. It continuously gathers reports from diverse Sri Lankan news websites (via RSS) and official social media (verified news pages, journalists, government accounts). When multiple sources report the same incident, it automatically clusters them and generates one factual summary, stripping away fluff and bias. Readers get the full story at a glance – backed by cross-verified information – instead of reading several articles. This saves time and builds confidence that the news is accurate. The summaries are provided in English, Sinhala, and Tamil, ensuring accessibility across linguistic groups. In short: one incident, one summary, in your preferred language – with transparency about all sources behind it.
Why We’re Different (vs. Google News or Local Aggregators): Unlike Google News which just groups links, our MVP actually writes a combined summary for each story. It doesn’t merely redirect you to various sites; it gives you the essential facts in one place. Traditional aggregators are essentially feed readers – you still have to click each headline and wade through duplicate content or slanted storytelling. Our system uses AI to cross-check multiple articles on the same topic and identify the consistent factsfluxnewsapp.com. By condensing many sources into one overview, we spare users from opening 5–6 tabs per story. Moreover, neutrality is a core design goal: we emphasize points corroborated by more than one source, and if reports conflict, we call that out rather than choosing a side. As a result, the experience is closer to reading an unbiased news briefing than a feed of headlines. We also explicitly cover all three languages side-by-side, which Google News and others do not – a Sinhala reader can get the same factual summary as an English reader, bridging Sri Lanka’s language divide. Finally, we prioritize trusted sources (mainstream media and verified accounts) to filter out noise. The aim is a product that busy students, professionals, and diaspora can rely on daily for quick, trustworthy news – a significant leap from today’s fragmented, often biased news consumption model.
2. MVP Scope (Strict)
MVP Must-Have Features:
Automated Multi-Source Ingestion: The system will fetch news items continuously from a fixed list of Sri Lankan news RSS feeds (e.g. major newspapers, news sites) and select authoritative social media accounts (official Facebook pages, X/Twitter of reputable media, government, etc.).


Story Clustering: When two or more sources refer to the same incident or news event, the backend will group those items into a single “incident cluster.” Clustering can initially be simplistic (e.g. matching on similar headlines or keywords) but should correctly bundle obvious duplicates.


AI Summarization (English): For each cluster of sources, the system will generate one neutral, factual summary in English using an OpenAI model. The summary will incorporate key facts from all sources without editorializing.


Multilingual Summaries: The English summary will be translated or re-generated in Sinhala and Tamil. This can be done via the OpenAI API as well (prompting the model to produce a summary in Sinhala/Tamil) or by translating the English text, ensuring the meaning remains accurate.


Web Frontend (Next.js): A simple, fast-loading website that displays the aggregated news feed. The homepage will list the latest incident summaries (with title, brief snippet, timestamp).


Incident Detail Page: Clicking a story shows the full summary and a list of the original sources used (with links to the news sites or posts for transparency). Users can toggle the summary’s language (English/Sinhala/Tamil) on this page or globally.


Source Attribution & Updates: Each summary will indicate which sources were combined. If new information comes in (new source added to cluster), the summary can be refreshed and an “Updated” time or indicator shown.


Backend on Vercel Cron: A scheduled job (or Edge Function) on Vercel triggers periodic fetch and processing (e.g. every 5 or 10 minutes) to update the news clusters and summaries.


Out of Scope for MVP:
User Accounts & Personalization: No logins, profiles, or personalized news feeds. MVP assumes a general feed for all users (focus on core functionality before adding personalization).


Mobile Apps or Complex UI: Only a responsive web app is delivered. Native iOS/Android apps, browser push notifications, or custom UI animations are not included at this stage.


Extensive Topic Categorization: We won’t implement advanced topic filters or categories beyond maybe a simple tag (e.g. local vs international news, if needed). The MVP feed is essentially chronological/top stories rather than offering full category navigation.


Full Social Media Firehose: We will not ingest arbitrary user posts or unverified social content. Only curated, authoritative social accounts are included. Likewise, we won’t attempt comprehensive real-time Twitter crawling or Facebook comment analysis in MVP.


Bias Meter or Fact-Checking Annotations: Any sophisticated features like bias indicators, sentiment analysis, or claim verification logs (as seen in some advanced products) are not in MVP. We focus purely on delivering a combined summary and listing sources.


Monetization & Ads: No ads, subscriptions, or payments in the MVP. The service will be free and open during the MVP phase, as we validate the concept.


Extensive Historical Archive: MVP will store recent news needed for clustering, but we won’t build user-facing archive search or long-term storage of all content. The focus is on current news (say, last few days or weeks).


Manual Editorial Curation: The system will not have human editors writing or tweaking summaries. All summaries are AI-generated (with our prompts/rules). Human oversight may be used internally for testing, but not as a product feature.


Assumptions to Test in MVP:
Users Want Summaries: We assume target users prefer a short combined summary over reading full articles. MVP will validate if users find this sufficient or still click through to original sources.


Multi-Source = Higher Trust: A key hypothesis is that showing a story is sourced from multiple outlets (and actually using multiple inputs) will increase user trust. We’ll watch for feedback on whether the product feels more credible or neutral than single-source news.


Language Accessibility Matters: We believe offering Sinhala and Tamil summaries will expand our reach and usefulness (especially for students more comfortable in native languages). MVP tests whether multi-lingual support drives adoption or if English alone would suffice initially.


Feasibility of AI Summaries on News: We need to confirm that the OpenAI API can handle Sri Lanka-specific news content (including names, places) in multiple languages accurately. MVP assumes GPT-4 (or similar) can summarize without major hallucinations or errors, given careful prompting. We’ll validate this assumption and measure summary accuracy.


Supabase + pgvector for Clustering: We assume we can achieve acceptable story clustering using text embeddings in Postgres (pgvector) within reasonable performance. The MVP will test if our approach correctly groups news or if mis-groupings are common.


Frequency of Updates: We hypothesize that a periodic polling (cron job) is sufficient for “continuous” news delivery in Sri Lanka’s context (where breaking news frequency is moderate). We assume a ~5-15 minute update cycle won’t feel too stale for users. This will be evaluated against user expectations for timeliness.


By constraining scope, the MVP will remain buildable by a small team (or solo founder) in a couple of months, focusing on the core innovation: multi-source neutral news summaries.
3. User Personas & Use Cases
To ensure the product addresses real needs, we’ve identified a few representative users and how they would use the MVP:
Persona 1 – Nimal (Age 18, Student): Nimal is a high school student preparing for A/L exams. He needs to stay informed on current events for his General Knowledge paper and often discusses news in class. However, he finds newspapers too biased and long-winded. Use case: Each evening, Nimal opens the app and reads the concise summaries of the day’s major events in Sinhala, his preferred language. In 10 minutes, he gets a neutral briefing on politics, economics, and world news that appeared in multiple outlets. If he needs more detail, he clicks the source links to maybe read further for an essay. Success for Nimal is when he feels confident he knows the key facts without having to trust any single newspaper’s take. The multi-source summary ensures he isn’t unknowingly parroting one outlet’s bias, which is crucial for exam answers requiring balanced viewpoints.


Persona 2 – Arjuna (Age 34, Busy Professional): Arjuna works in Colombo at a multinational company. He’s busy with work and family, leaving little time to follow news, yet he wants to stay updated on major developments (especially economic or infrastructure news that could affect his job). Use case: During a break or commute, Arjuna opens the web app on his phone. The homepage feed in English gives him quick summaries. For example, he sees a summary of a new government policy that was reported by several newspapers that morning. Instead of reading four different articles, he trusts the combined summary’s facts. He appreciates that trivial political gossip (often single-sourced) is filtered out – only well-substantiated stories appear. Success for Arjuna means he can consume the day’s news in a short time (e.g. 5 minutes), gleaning the essentials confidently. He feels informed at work meetings or social gatherings despite spending minimal time, and he hasn’t been misled by sensationalism because the app stuck to verified information.


Persona 3 – Tharshini (Age 40, Sri Lankan Diaspora in Canada): Tharshini lives abroad but closely follows Sri Lankan news to feel connected. She often had to juggle multiple websites (Sinhala and English) to piece together what’s really happening, especially during fast-moving events. Use case: With our product, each morning Tharshini checks the Tamil summaries of key stories. When a major incident (say a flood or election news) occurs, she sees one summary that mentions all official reports from Sri Lanka. If local media and an international source both covered it, the summary reflects both. She no longer worries about missing context due to being far away – the app consolidates local chatter and official news. Success for Tharshini is feeling in the loop and trusting that she gets an unbiased, comprehensive overview that she can also share with her family (who speak different languages). The neutral tone reassures her that she’s hearing facts, not political spin.


Persona 4 – Ravi (Age 29, Tuition Teacher): Ravi teaches general knowledge and current affairs at a tuition center. He likes to use real news examples in his lessons and sometimes gives students news articles to practice reading comprehension. Use case: Ravi uses the product to quickly find current stories summarized without bias. In class, he might project a summary (e.g. of a science achievement or a historical event commemoration) in English, then show the Sinhala version to discuss language differences. Because all sources are listed, he can point students to original articles for homework. Success for Ravi is having a reliable, quick source of factual news that can be understood by students at various language skill levels. It saves him time (no need to curate multiple papers) and he trusts that the info is cross-verified, so he won’t inadvertently share a one-sided story.


Each persona’s success scenario revolves around time saved, trust gained, and accessibility (language or bias-level) improved. If the MVP resonates with these users – indicated by repeated daily use and word-of-mouth endorsements – we’ll know the core idea is working.
4. System Architecture
Our system has two major components operating in tandem: (1) a background data pipeline that handles news ingestion, clustering, and summarization, and (2) the user-facing web application that presents the summarized news. We intentionally separate heavy data processing from the frontend to ensure the site is fast and the backend can scale or be modified independently.
High-Level Flow:
Data Ingestion (Sources → Database): A background job periodically fetches new content from each source. Sources include RSS feeds from news sites and APIs or scrapers for social media accounts. Each fetched item (an article or post) is normalized into a standard format and stored in our Supabase PostgreSQL database. Duplicate detection happens here to avoid ingesting the same article twice.


Clustering Engine: After new articles are ingested, a clustering process runs. It uses text embeddings (via pgvector) or other similarity measures to group related articles that likely describe the same event. If an incoming article is similar to an existing cluster’s content, it’s attached to that cluster; if not, a new cluster (story) is created. This grouping ensures multiple reports on one story are linked together.


AI Summarization Pipeline: For any cluster that reaches a threshold (e.g. at least 2 sources, or a significant update), the pipeline triggers an OpenAI API call to generate a summary. The AI is fed the key facts from all articles in the cluster (or possibly the full texts if short, or extracted highlights) and instructed to produce a concise, factual summary. This summary is then saved to the database, associated with the cluster.


Multilingual Output: Once an English summary is obtained, the system requests translations or new summaries in Sinhala and Tamil. This could be done by sending a prompt to the AI for each language (ensuring the content remains equivalent). These versions are stored as well, linked to the same cluster.


Frontend Serving: The Next.js frontend queries the Supabase database (via APIs or direct access using Supabase client libraries) to retrieve the latest clusters and their summaries. The homepage renders a feed of recent story summaries. Each summary includes metadata like its timestamp, language, and list of sources (with URLs). The frontend is mostly static content (could even use incremental static regeneration for performance), since updates happen via the pipeline.


User Interaction: When a user selects a story on the frontend, a dedicated story page shows the full summary and sources. Users can toggle the summary’s language, which triggers the frontend to fetch the corresponding text from the database (already pre-generated by the backend). No additional AI calls occur on the fly in the user interaction path – all AI work is done in the background pipeline for predictability and cost control.


Separation of Concerns: The background pipeline (ingestion → clustering → summarization) can be thought of as a series of batch processes or micro-services running on a schedule. It does the heavy lifting: fetching data from external URLs, computing embeddings, and calling the OpenAI API. This can run on Vercel’s serverless functions triggered by a cron schedule, or on a separate lightweight server. Meanwhile, the website (Next.js + Supabase) handles only read operations for end-users, serving the summaries with minimal processing. This separation ensures that if the AI or clustering jobs are running slowly or even fail, the website itself remains up – it will just show the last available data. It also means we can scale the pipeline (in frequency or compute) independently of user traffic.
Integration of Components:
RSS Feeds & Scrapers: We maintain a list of feed URLs in the database (or configuration). The pipeline fetches each feed sequentially (or in parallel batches) during each cycle. For social media, since RSS is not available for Facebook or X, we may use their APIs if possible or rely on third-party feed aggregators. For MVP, we might start with a limited number of known RSS sources (many Sri Lankan news sites offer RSS or JSON feeds) and a few social sources via API.


AI & Clustering in Workflow: Not every fetched item triggers AI. Only when an item contributes to a cluster with sufficient content do we call the summarizer. This rule-based trigger conserves API usage (e.g., if an isolated story has only one source, we might skip AI and either not show it or show it as single-source news without a summary). Clustering happens continuously so that as soon as a second source appears for a story, we can generate the summary.


Data Flow Example: Suppose two newspapers and a TV news site all publish about the same protest. The pipeline fetches each article (title, full text, etc.). Each is stored as a row in Articles. The clustering module finds their content vectors are close in semantic space and groups them into a cluster (say cluster #42). Now cluster #42 has 3 members – pipeline sees this and invokes AI: “Summarize these 3 reports into one”. The AI output (summary) is saved in Summaries for cluster #42. On the frontend, cluster #42 now appears as one story with that summary and references to 3 sources. If another source (e.g. a verified Tweet with new detail) comes in later, pipeline will add it to cluster #42 and optionally regenerate the summary (or mark the cluster as updated and maybe highlight the new detail if significant).


This high-level architecture emphasizes modularity – we could swap out the clustering logic or the AI model without overhauling the frontend. It also aligns with keeping the user experience fast and reliable, since all complex operations happen in the background.
5. Data Pipeline Design
The data pipeline is the heart of the MVP’s functionality. It is a series of stages that transform raw news inputs into polished summary outputs. Below is a step-by-step breakdown of how data flows through the system, including how we handle errors, avoid duplicates, and manage updates:
Source Fetching: A scheduled process (cron job) kicks off the pipeline periodically (e.g. every 10 minutes). It iterates through the list of sources (RSS feeds, APIs for social accounts). For each source, it retrieves any new items since the last fetch (RSS provides pubDate or GUIDs; for APIs we track last seen IDs/timestamps).


Error Handling: If a fetch fails (e.g. network error or feed down), that source is skipped for now and will be retried on the next cycle. We log these failures but the pipeline continues for other sources. This ensures one flaky feed doesn’t stop the whole ingestion.


We also parse the content carefully. If a feed item is missing data or malformed, we either discard it or attempt basic cleaning (e.g. remove HTML tags from descriptions). Any serious parse error for an item results in that item being skipped, rather than crashing the pipeline.


Normalization & Storage: Each fetched news item is normalized into a standard structure: title, full text content (if available), publication timestamp, source reference, and possibly an initial language code detection. We then attempt to insert it into the Articles table in the database.


Duplicate Avoidance: Before insertion, we check for duplicates. The simplest check is by a unique constraint on something like the URL or an external ID. RSS items often have a unique link or GUID; we store that and avoid inserting if we already have it. We may also do a quick text similarity check (or hash of content) to ensure the same article isn’t inserted twice from two sources (e.g. AP content reprinted – a dedup step). As Feedly found, a large portion of articles can be near-duplicatesfeedly.com, so this deduplication step is important to not waste effort clustering identical texts.


If the article is new, it’s inserted with a status like “unclustered” initially. We also generate a vector embedding of the content (or title + description) at this stage. Using pgvector, we can do this via an API call to an embedding model (OpenAI’s embedding or a local model) and store the resulting vector in the article row. If the embedding service fails, we might retry once; if it’s unavailable, we mark the article for embedding later, but we still store the text.


Clustering Stage: After new articles are stored (with embeddings), we attempt to cluster them:


We query the recent articles (e.g. within last X hours or days) for clustering. Using the new articles’ embeddings, we perform a similarity search in the vector space to find related articles. For each new article, we find if there’s an existing cluster whose centroid or one of whose members has high cosine similarity above a threshold. If yes, we assign the new article to that cluster (i.e., update its cluster_id field or insert a row in the article-cluster mapping table). If no similar cluster is found, we create a new cluster (insert into Clusters table, with initial metadata like first article title as tentative headline).


We might use a simple heuristic: if an article’s title or content shares many proper nouns or keywords with another article (e.g. both mention “Colombo”, “dengue outbreak”, and date), group them. This hybrid of semantic embedding and keyword overlap can improve precision in MVP without heavy NLP.


Merging & Splitting: MVP will keep clustering logic straightforward, likely no dynamic splitting of clusters. However, if by chance two clusters later seem to be about the same event (maybe due to an indirect connection or late discovery), MVP might leave them separate. Fine-tuning cluster granularity is complex; initially, we accept occasional over-clustering or under-clustering, focusing on obvious groupings.


Error Handling: Clustering is mainly in-memory logic. If something goes wrong (e.g. vector search fails), we can fall back to a simpler method (like match by title similarity) for that cycle. The pipeline should not crash on clustering errors; at worst, some articles remain unclustered until next run.


Trigger Summarization: After clustering, we identify which clusters need summarization or an update:


New cluster with >= 2 articles → needs an initial summary.


Existing cluster that got a new article (thus cluster size increased or new info added) → ideally update the summary.


We maintain a flag in the cluster record like summary_status (none, pending, done, needs_update). New multi-source clusters get marked as pending summary.


For each cluster requiring a summary, we prepare the prompt for the AI summarizer. We gather the content of all articles in that cluster (possibly with a length limit – if too long, we might truncate or select the most relevant facts). We then craft a prompt emphasizing neutrality and factual reporting. For example: “Summarize the following information from multiple news reports into one factual, neutral news brief. Include all key details that are confirmed by at least two sources. If sources disagree on a detail, note that reports differ without adding any new information. Sources:\n[Content snippets]”.


We call the OpenAI API (likely GPT-4 or GPT-3.5 if cost-sensitive) with this prompt. On success, we get a summary text.


Error Handling: If the API call fails (network or error from OpenAI), we catch it. We might retry once if it’s a transient error. If it fails persistently, we mark that cluster’s summary as failed and will retry on the next cron cycle. This ensures a glitch in AI service doesn’t drop the story entirely – it will try again in a few minutes. We also put safeguards on cost: e.g. limit the prompt size to avoid very large context (which would cost more and risk failure).


Hallucination checks: While we can’t fully verify AI output in MVP, we mitigate obvious issues by prompting it to stick to given info and perhaps by post-checking certain facts. For instance, if the summary mentions a number or name not present in any source content (we could programmatically check this), we might decide to discard that summary as potentially hallucinated and retry with stricter prompt or wait for more sources.


Storing Summaries: For each successful AI summary, we store it in the database. This could be in a Summaries table or in fields on the Clusters table (e.g. summary_en). We also store the timestamp of creation and maybe the list of article IDs used, for traceability.


We then immediately generate the Sinhala and Tamil versions. This could involve calling the OpenAI model with “Translate the above summary into Sinhala” (ensuring the model doesn’t alter meaning) or re-running a summarization prompt with sources directly in Sinhala/Tamil. However, since sources might mostly be in English, it might be safer to produce the English summary then translate. We’ll likely utilize the AI for translation to preserve nuance (since it can handle Sinhala/Tamil as target languages). Those translations are then stored (e.g. summary_si, summary_ta).


The cluster is now marked summary_status = done. It’s ready for display. We attach a field like last_updated to show when summary was last refreshed.


Publishing to Frontend: The frontend is not literally “pushed” new data; rather, it will pull from the DB. However, we might use Supabase’s real-time subscriptions or revalidation triggers to update the feed in near-real-time. In MVP, a simpler approach: the Next.js app could fetch server-side on each request or poll the database periodically for updates. Given moderate traffic, we might let users refresh manually or just count on them opening the page anew.


We ensure the data is sorted (e.g. clusters sorted by latest timestamp or creation time) so the feed shows newest stories first.


If a summary gets updated, we may have the frontend indicate “Updated” next to the title, possibly by comparing created_at vs last_updated fields.


Avoiding Duplication: At multiple stages, we addressed duplication:
Article level: using unique IDs/hashes to avoid storing the same article twice.


Content level: using clustering so the same event doesn’t produce two separate summaries.


We also plan to collapse exact duplicates (like wire copy) as one article entry with multiple sources. For MVP, we might not fully implement the advanced dedup (like Feedly’s LSH that catches 80% similar textsfeedly.com), but we at least ensure if two articles have extremely high similarity, they go into one cluster (even if one word differs).


The goal is that users never see two summaries for what is clearly the same news event.


Handling Updates and New Information: A significant benefit of multi-source news is the ability to update the story as more info comes in. Our pipeline supports this by re-running summarization:
When a cluster that already has a summary gets a new article, we mark it for update. The next cycle, it will compile all sources (including the new one) and generate a revised summary. We might design the prompt to incorporate phrasing like “Initially, X was reported. Later, new reports added Y.” if needed, but at minimum it will include any new facts.


We need to be careful: sometimes initial news is incorrect and later sources correct it. Our summarizer should, if possible, reconcile that (perhaps by preferring the latest info but noting discrepancies). For MVP, a simple approach: the summary always reflects the latest consensus, and if contradictory figures exist, mention the range or that “reports differed”.


The cluster’s last_updated time is set to now, and the frontend can show that the summary was updated. We might even highlight that to users (e.g. “Update: death toll revised from 5 to 7 as per new sources” as part of summary text).


If an article is updated at the source (e.g. a news site updates their story with corrections), our pipeline might not catch that unless the RSS surfaces it as a new item or we re-fetch content periodically. MVP assumption: we treat each article as static once fetched. If major corrections occur, likely another source or another article will note it, which will then feed in.


Pipeline Robustness: We implement logging at each stage to track what’s happening (for debugging and measuring performance). If the pipeline entirely fails one run (e.g. due to a bug), Vercel might alert or we notice the absence of new stories. We keep the architecture simple enough to reduce such failures. Also, since MVP load is small, sequential processing is acceptable (though we could parallelize fetches or AI calls if needed to speed it up).
In summary, the data pipeline takes care of collecting and condensing the news. It ensures that by the time data reaches the user, it’s already curated and summarized. This multi-stage design – fetch → store → cluster → summarize – closely mirrors proven aggregator modelsmedium.com, where raw news is encoded and clustered, then summarized for outputmedium.com. By carefully handling duplicates and updates, we aim to provide a seamless stream of news stories, each representing a coalition of sources rather than a single voice.
6. Accuracy & Trust Model
Earning user trust is paramount for a news product. Our approach to accuracy and trust is to base everything on verifiable facts from multiple sources and be transparent about those sources. The system’s design includes checks and rules to maintain factual accuracy and avoid misleading information.
Fact Extraction & Verification Strategy: Rather than have the AI freestyle a summary, we follow a facts-first approach. This means the AI’s input is the set of facts (or full text) from the sources themselves, and we instruct it to only use that information. We effectively outsource judgment of importance to the AI, but not the raw facts. For instance, if Source A says “10 people injured” and Source B says “several people injured,” the AI is expected to report “10 people were injured (as reported by [source])” or at least include the number 10 if it’s corroborated, rather than invent a new number. We emphasize in the prompt that it must not introduce any information not found in the source texts. This constraint is meant to curb hallucinations.
Multi-Source Confirmation Rules: The system leverages the agreement between sources as a proxy for truth. Concretely:
A detail or claim will be included in the summary if it appears in at least two independent sources. This cross-verification is how we decide what’s a confirmed fact. If only one source mentions a particular detail (e.g. an unverified claim or a unique detail), the summary might either omit it or clearly attribute it (“According to X, …”) if it’s important. By focusing on overlap, we capture the consensus facts. This approach mirrors journalistic principles and is similar to what other projects do – e.g. Particle News waits for multiple publishers before summarizingnewsroomrobots.com. In our MVP, we set a lower threshold (2 sources) given the smaller media ecosystem, but the principle holds.


If two reputable news outlets report something, we treat it as likely accurate. If there’s a discrepancy between sources on a factual point (numbers, cause of event, etc.), we don’t let the AI gloss over it. Instead, we have a “reports vary” rule: the summary will note the disagreement. For example, “There are conflicting reports on the casualty count, with one source reporting 5 and another reporting 7.” This way, the user is informed of uncertainty rather than given potentially false precision. This rule turns potential inconsistencies into part of the story, increasing transparency.


Conflict Handling: When sources diverge, the system should never arbitrarily choose one version. Some strategies:
Minor Differences: If differences are minor (e.g. one source spells a name slightly differently), the summary will use the more common or official version and likely not mention the other, to avoid confusion, but still internally it’s a check.


Major Conflicts: If it’s a substantive conflict (cause of an event, significantly different numbers or accounts), the summary includes a line about the discrepancy. We’d rather the summary be slightly longer but honest, than “smooth” it over incorrectly. This is in line with our neutrality goal.


Unverified Social Media Info: If a social media source (say a tweet from a journalist) reports something not yet confirmed elsewhere, we handle it carefully. The system might delay summarizing that until a second confirmation, or mark it as unverified. In practice, for MVP, we might simply require that any social media input must be corroborated by a news article before it influences the summary. Alternatively, if it’s a primary source (like a government official’s statement on social media), we treat that as a valid source but will attribute it (“the Education Minister announced via Twitter that…”).


Source Credibility & Inclusion: We curate the input sources to already be those considered authoritative or at least widely followed. By filtering out known unreliable outlets from the startfluxnewsapp.com, we reduce the risk of injecting false claims. Our source list includes mainstream newspapers, TV news sites, and known official pages. We exclude outright propaganda sites or purely partisan blogs in the MVP. This pre-selection is part of trust: users should recognize the sources listed and feel comfortable that if all of those reported something, it’s likely true. We might also include sources across the spectrum (state media and independent media) to balance biases – but focusing on factual consistency, not opinion.
Social Media Verification: For social sources like Facebook or X:
We only use posts from verified accounts or official pages (e.g. President’s official Facebook, Health Ministry’s Twitter, BBC Sinhala Facebook page, etc.). This ensures at least the identity is confirmed.


We cross-check critical info from social media against news sources whenever possible. If a tweet is the first to break news (“Earthquake felt in Colombo”), we will wait to see if news outlets pick it up before summarizing. The exception might be if multiple trusted social accounts (like several journalists on X) all report the same event in real-time – then our system could cluster those and summarize that “Reports from multiple journalists indicate an earthquake was felt in Colombo…” with a big caveat that it’s developing.


We also avoid using social media comments or unmoderated content – only the main posts by known entities.


Preventing AI Hallucinations: Hallucination (AI making up facts) is a known risk. We mitigate this in several ways:
Controlled Input: The AI sees the actual news text. We are essentially doing abstractive multi-document summarization, not Q&A. By providing all relevant text, the model doesn’t need to guess facts – they’re in front of it. It’s instructed to summarize, not to predict missing details.


Verification Layer (Potential): While full implementation may be beyond MVP, we take inspiration from approaches like Particle’s “Reality Check” layernewsroomrobots.com. In MVP, a lightweight version might be: after generating a summary, we automatically scan the summary for any entity or number, and verify it appears in the source texts. If the summary says “the project cost Rs 5 million” and none of the sources mention “5 million”, that’s a red flag. We could log such cases for review or even drop the problematic sentence. This could be done by simple keyword search or more advanced techniques if time permits.


Human Spot-Checks: As this is an MVP aiming for high trust, we may internally do periodic manual reviews of summaries versus sources, especially in the early days. This isn’t scalable long-term, but it can help catch any systematic issues with the AI’s output (e.g. always mis-translating a certain term, or skipping an important detail).


Simplified Language Output: We ask the AI to use straightforward, fact-based language (“just the facts” tone). This reduces the chance of it introducing speculative or flowery content. The summaries will read like wire service news briefs, not analysis.


In fact, part of our model is that the summary almost acts like an API of facts (similar to the “facts layer” conceptnewsroomrobots.com). By focusing on facts as building blocks, we align the AI output with what’s verifiable.


Transparency to Users: Trust is also reinforced by what the user can see:
Every summary lists the sources that were used to create it. Users can click those links and verify the details themselves. Knowing that the summary isn’t pulling claims out of thin air – it actually came from, say, Daily Mirror and TamilGuardian articles – adds credibility.


We avoid overly definitive statements if not supported. For example, if something is still developing, the summary might say “Investigation is ongoing” rather than “It is confirmed that…”, unless it truly is confirmed.


We will also include timestamps (e.g. “Updated 1 hour ago”) so users know they have the latest info or that things might have changed since then.


In essence, our accuracy model is multi-source validation. By requiring multiple attestations for information and by being candid about disagreements, we minimize the risk of single-source errors or biases. This multi-source approach inherently reduces misinformation, as one source’s mistake might be corrected by another’s coveragecpalanka.org. Other AI news apps emphasize similar cross-checking to ensure credibilityfluxnewsapp.com. We are building that philosophy in from day one: trust comes from corroboration. The MVP will prove out whether this indeed produces summaries that users find accurate and trustworthy.
7. AI Design
Artificial Intelligence is used in the MVP in targeted ways to augment rather than replace the journalistic process. Our AI design revolves around a pipeline of specific tasks, ensuring we maintain control and interpretability at each step instead of one monolithic AI doing everything. We favor a facts-first, structured AI usage, meaning we use AI where it excels (language understanding and generation) but within boundaries set by our data and rules.
AI Tasks in the System:
Content Embedding for Clustering: We use AI-derived embeddings to represent article content in vector form. This isn’t a generative task, but it leverages a language model’s understanding of semantics. For example, using OpenAI’s embedding API or a library like Sentence-BERT, each article’s text is converted to a high-dimensional vector. The task here is unsupervised feature extraction. The reason: similar news stories will have similar embeddings, allowing clustering by vector similaritysupabase.com. This AI step is essentially under the hood, enabling the grouping of articles without human-defined keywords.


Multi-Document Summarization (English): This is the core AI generative task. Once a cluster of related articles is identified, we employ an LLM (Large Language Model) to perform abstractive summarization across those multiple documents. The prompt provides the combined info and asks for a concise summary. Key design considerations:


We instruct the model explicitly to focus on facts and points of agreement across sources. Our prompt might say: “Here are several reports on the same incident. Summarize them in a factual news report style. Include all important details that are present in multiple reports. Do not include opinions or unverified claims.”


By structuring the input (we might list bullet points extracted from each source in the prompt), we follow a structured generation approach. For instance, we might first internally use a script to extract major facts from each article, then feed those as bullets to the model to rewrite as a coherent story. This two-step approach (fact extraction then summarization) is a way to implement the facts-first approach mentioned earlier. Even if we don’t fully implement an extraction step in MVP, the concept influences the prompt design.


We also choose an appropriate model: GPT-4 for best quality (especially important if the content involves complex or multilingual aspects) or possibly GPT-3.5 if we optimize for cost and it proves competent in our tests.


Translation / Multilingual Summarization: For Sinhala and Tamil outputs, we have a couple of design options:


Option A: Translate the English summary using AI. This is essentially a machine translation task. GPT-4 can translate to Sinhala/Tamil reasonably well, or we could use a dedicated translation model/API for possibly better linguistic nuances (given Sinhala and Tamil might have idiomatic differences). However, using the same OpenAI model ensures consistency of style.


Option B: Direct summarization in target language. We could feed the original sources (if they include Sinhala/Tamil sources) or translated versions of sources to GPT and ask it to produce a summary in Sinhala or Tamil. This might capture context better if the sources are multilingual. But if most sources are English, this essentially is translation of an English concept.


MVP likely goes with Option A for simplicity: generate English summary, then have AI translate it to Sinhala and Tamil. We will need native speakers (or at least validation) to ensure the translations are correct and neutral. The model might occasionally use a formal vs informal tone; we’ll aim for formal journalistic tone in Sinhala/Tamil as well.


The AI tasks here are thus either using GPT’s multilingual capabilities or chaining an English summary through a translator. We will test small samples to ensure quality (Sinhala and Tamil have unique scripts and idioms; we may adjust prompts like “Provide the summary in formal written Sinhala suitable for a newspaper” to guide tone).


Optional Analytical Tasks (Future): While not in MVP scope, we note that we are not doing sentiment or bias analysis via AI (like Particle’s bias meter uses human data with AI to display biasnewsroomrobots.com). All AI usage is geared towards summarization and language. We avoid any AI that “classifies” news as good/bad or tries to infer trustworthiness of a source – we handle trust via source selection manually in MVP.


Rationale for Facts-First Approach: Large Language Models are powerful but can produce incorrect information confidently if not grounded. By structuring our AI interactions around the content we supply, we greatly reduce that risk. Our pipeline ensures AI always has something to summarize – we’re not asking it questions without context. This approach is similar to Retrieval-Augmented Generation (RAG) patterns, where the model is fed relevant documents and asked to synthesizemedium.com. The difference here is we are retrieving multiple related documents (news articles) rather than Q&A with a knowledge base, but the principle is similar: the truth is in the source material. We also draw inspiration from multi-source answer engines that cite their sourcesnewsroomrobots.com. For our summarizer, we don’t require it to output citations to the user, but internally we ensure everything comes from source text.
Clustering Method (AI vs Non-AI): We considered using AI directly to decide if two articles are about the same story (e.g. by feeding two titles to GPT and asking if they describe the same event). However, this would be slow and costly at scale. Instead, we rely on vector similarity (a more scalable AI-based solution) and possibly simple heuristics. This is unsupervised and doesn’t require GPT’s heavy lifting. It’s also more deterministic: given the same embeddings, we cluster in a consistent way, which is easier to test and refine than an opaque AI decision. The embedding model captures semantic similarity which should be sufficient for our needs, as shown by how well content embeddings cluster by topicsmedium.com. For MVP, we might supplement with a heuristic (e.g., if two articles have the same specific proper noun and date in the title, that’s obviously same event) as a sanity check.
When AI is Triggered (and when it’s not):
Triggered: Only after we have determined a cluster has enough information. For example, one article alone might not trigger summarization. We probably need at least 2 sources for a cluster to warrant a summary (and perhaps if only 2, we ensure they’re not duplicates of each other). This means AI summarization calls happen relatively infrequently compared to total articles fetched. The initial clustering might accumulate a few single-article clusters that sit idle until a second article arrives or a certain time passes.


Not Triggered: If an article stands completely alone (only one source on a minor story), the MVP might not use AI on it. We could either omit that from the feed or present it minimally (perhaps just the headline from that one source labeled as single-source). The reason is to keep our focus on multi-source verified news – single-source stories are not yet “verified” in our model. Also it saves cost. If over time we see valuable single-source news that users want, we may handle it differently (maybe mark it as such and still summarize). But MVP scope is stricter: no AI for those.


Additionally, AI is not used in fetching or parsing data (that’s done with traditional scripts), and not in deciding what’s true – that’s based on multiple sources and rules, as above.


AI for Translation will be triggered for every summary that’s generated, since providing multilingual output is in scope. So effectively, when a cluster is summarized in English (1 AI call), we then do 2 more calls (Sinhala, Tamil). We will see if we can combine these (maybe a single prompt could ask for all three languages output, but likely better to do separate to avoid confusion). We’ll have to monitor cost but since the summaries are short, these calls are not heavy on tokens.


Prompt Design & Iteration: We will invest effort into prompt engineering to get the desired output style. For example:
We want the summary to read like a neutral newswire piece. Our prompt might emulate an Associated Press style guide: e.g. “Write in third person, past tense, neutral tone. Do not include any opinions or subjective language. Stick to the facts given.”


If the AI sometimes produces something undesired (like speculation or an irrelevant detail), we refine the prompt or pre-process the input to avoid that detail.


For multilingual, we ensure to mention the target language and possibly give an example of tone if needed (“Translate the above summary into Sinhala, maintaining a formal news tone. Use straightforward language without colloquialisms.”).


We might also include in the prompt a structure hint: e.g. “Begin with a one-line headline or lead sentence summarizing the incident, then provide 2-3 sentences of detail.” This helps keep summaries uniform and crisp.


Clustering AI Summaries? One question: do we ever cluster clusters? Probably not needed in Sri Lanka context – the volume isn’t so high that we’d have separate clusters for the same event unless our initial algorithm errs. If it does happen (e.g. “power outage in Colombo” cluster1 and “blackout in capital” cluster2 formed separately), a human might notice and we could merge manually during MVP testing. But automating cluster merges might be too advanced for MVP. We’ll rely on tuning the similarity threshold to catch such cases early.
AI Limitations Acknowledgment: We are aware AI can have limitations with local proper nouns or context. We’ll monitor cases like transliteration of Sri Lankan names between languages (the AI might output a slightly different Sinhala name than an official one, etc.). MVP’s small scale allows us to catch and correct such issues by adjusting prompts or even using a lookup table for known entities (for example, if the President’s name appears, ensure consistent spelling in all languages).
In summary, our AI design choices revolve around using AI where it adds the most value – summarizing and translating – while constraining it with multi-source data to ensure accuracy. We essentially create an AI-assisted newsroom pipeline where the AI is the tireless reporter writing summaries from a stack of articles. By structuring tasks (embedding → cluster → summary → translate), we keep the system understandable and debug-friendly. This modular AI approach aligns with industry best practices to reduce hallucinationnewsroomrobots.comnewsroomrobots.com and maximize factual integrity. The result should be concise, trustworthy summaries that read as if a human editor compiled the best from each source.
8. Database Design (MVP)
The MVP uses Supabase (PostgreSQL) as the database, with the pgvector extension for handling embeddings. Our schema is lean, focusing on storing articles, clusters (incidents), and associated metadata needed for the product. Below are the key tables and their design rationale:
Sources Table (sources): This table lists all the news sources and social accounts we pull from.


Key Fields: source_id (PK), name (e.g. “Daily Mirror”), type (enum: ‘rss’, ‘twitter’, ‘facebook’, etc.), url or feed_url, language (primary language of the source, e.g. “EN”, “SI”, “TA”), and maybe trust_level or enabled (to toggle a source on/off easily).


Why: This allows dynamic management of sources without code changes. If we need to add a new RSS feed, we insert a row here. It’s also used by the pipeline to know what to fetch. Having a language helps if we decide to treat sources differently by language (maybe to decide if content needs translation before clustering).


Relationships: One-to-many with articles (a source has many articles).


Articles Table (articles): This stores each individual news item fetched from any source.


Key Fields: article_id (PK), source_id (FK to sources), title, content (the full text or main text of the article; could be TEXT or VARCHAR if we store trimmed content), published_at (timestamp), url (link to original), language (detected or as per source), embedding (vector type, e.g. VECTOR(1536) if using OpenAI embeddings of length 1536), cluster_id (nullable FK to clusters, set once article is assigned to a cluster).


Why: This is the raw data store of news content. We store the text both to have it available for summarization and to possibly display snippets if needed. The embedding field is crucial for efficient similarity queries using pgvector – we’ll index this with an approximate nearest neighbors index for performance. The cluster_id being on this table is a design choice for simplicity (one article belongs to at most one cluster). Alternatively, we could have a join table if an article could belong to multiple clusters, but in our model, that shouldn’t happen (clusters are distinct events).


We will add a unique constraint or index on something like (source_id, url) or (source_id, external_id) to prevent duplicates. Many RSS feeds include a GUID we can use.


language: If we ingest Sinhala or Tamil articles, this helps know if we should translate them to English for summarization. For MVP, likely most sources are English; but the field readies us for multilingual input as well.


Clusters Table (clusters): Each row here represents a news incident/story that one or more articles are about.


Key Fields: cluster_id (PK), title or headline (a representative title for the story – possibly one of the article titles or a generated short phrase), summary_en, summary_si, summary_ta (TEXT for each language summary), summary_date (timestamp when summary was last generated), num_sources (an integer count of distinct sources or articles in this cluster), first_seen (timestamp of when cluster was created, e.g. when first article arrived), last_updated (timestamp of last update/addition).


Why: This table holds the aggregated view. We include the summaries here for quick retrieval by the frontend. Storing summaries in the DB ensures we don’t have to re-run AI on every page load; they persist until updated. We also store meta like how many sources contributed – we can display “5 sources” to users easily. The title can be used as the display headline; often it could just be the title of the first article or a combination of keywords. (We might also refine it using AI or manually if needed, but MVP can use one of the article titles as a proxy).


Relationships: One-to-many with articles (the cluster_id on articles links here). We might query articles grouped by cluster to get member lists.


Note: We could break out summaries into a separate table if we wanted to track history or multi-version, but for MVP that complexity isn’t needed. One cluster has one current summary in each language.


(Optional) Cluster Members Table (cluster_members): This would be a join table listing article–cluster relationships explicitly. Given we have cluster_id on articles, we might not need this. However, sometimes a join table is useful if we want to allow an article in multiple clusters or to add additional info (like relevance score of the article in that cluster). Since we assume one cluster per article, we skip this table in MVP for simplicity.


(Optional) Translations Table: Not necessary if we store translations in clusters. If we expected dozens of languages or lots of text, a separate table could have cluster_id, lang, summary_text. MVP has exactly 3 languages and fixed schema, so columns are fine.


Logs/Errors (development use): We might have a simple ingest_log table or just rely on an external logging (like Vercel function logs). We likely don’t expose or deeply design this table for MVP documentation, but during development we’ll track issues.


Use of pgvector (Embeddings): The embedding column in articles is where we leverage pgvector. By storing article embeddings, we can run queries like: “find articles whose embedding is within X cosine distance of this new article’s embedding”. This is how we identify similar articles to cluster. Postgres with pgvector allows an index on this column to speed up similarity search. For example, if we have an embedding for the incoming article, a query might be:
SELECT article_id, cluster_id 
FROM articles 
WHERE articles.cluster_id IS NOT NULL 
ORDER BY embedding <-> :new_article_embedding 
LIMIT 5;

This gives the nearest neighbor articles and we check if the top one is close enough (below a similarity threshold) to consider it the same story. Essentially, pgvector lets us do efficient vector similarity directly in our DB, without needing a separate vector store or servicesupabase.com. This is ideal for MVP scale (a few thousand articles at most) since it keeps everything in one place and benefits from transactional consistency (we insert article and can immediately query for neighbors in the same transaction if needed).
Relationships & Access Patterns:
Fetch latest clusters for homepage: likely a query on clusters ordering by last_updated or first_seen desc, joining with maybe a subquery to get one representative article or the count of sources. But since clusters already has summary and maybe num_sources, the join may not be needed except to display source list.


Fetch a specific cluster (for incident page): a query to clusters by id, and a join to articles to retrieve the list of article titles and source names for that cluster (to show “Sources: X, Y, Z”).


The articles table may become large over time, but we can partition or archive older ones if needed. Clusters too, though fewer in number.


We might not need an explicit users table or preferences table in MVP, since no accounts. All user interactions are read-only queries.


Why Each Table Exists:
sources: Manageable config of inputs; helps maintain and display source info (for attribution logos or names on frontend).


articles: Core data ingestion storage. It’s important to keep raw content, both for summarization and in case we need to debug why a summary said something (traceability).


clusters: The main content served to users. By separating clusters, we encapsulate the “story” concept. It’s easier to mark a cluster updated, count sources, etc., than if we tried to derive that on the fly from articles each time.


We avoid overly complex relational design. For example, we’re not making a separate table for languages or for summary history. MVP keeps it straightforward with mostly one join between articles and clusters for most needs.


Example Data:
A row in sources might be: (1, 'DailyMirror', 'rss', 'https://www.dailymirror.lk/rss', 'EN')


An articles row: (101, source_id=1, title="Power outages in Colombo suburbs", content="...full text...", published_at="2025-12-20 14:00:00", url="http://dailymirror.lk/12345", language="EN", embedding=[vector], cluster_id=7).


A clusters row corresponding: (7, title="Power Outage Affects Colombo Suburbs", summary_en="A widespread power outage affected areas in Colombo... [factual details] ...", summary_si="... (Sinhala text) ...", summary_ta="... (Tamil text) ...", summary_date="2025-12-20 14:10:00", num_sources=3, first_seen="2025-12-20 13:50:00", last_updated="2025-12-20 14:10:00").


In this setup, retrieving the cluster 7’s info and sources is straightforward:
SELECT clusters.title, clusters.summary_en, clusters.summary_si, clusters.summary_ta, clusters.last_updated, clusters.num_sources,
       array_agg(sources.name) as source_names
FROM clusters
JOIN articles ON articles.cluster_id = clusters.cluster_id
JOIN sources ON sources.source_id = articles.source_id
WHERE clusters.cluster_id = 7
GROUP BY clusters.cluster_id;

This would yield the summary and a list of source names. The use of Supabase means we can call this via a RESTful endpoint or as part of Next.js server-side code using their client library.
Why pgvector specifically: It’s a pragmatic choice. Since we already use Postgres for structured data, adding pgvector avoids introducing a separate technology (like ElasticSearch or a dedicated vector DB) for similarity search. Supabase supports it out of the boxsupabase.com. For MVP scale, the dataset is small enough that Postgres can handle the vector indexing and search efficiently. This keeps our stack simple and low-cost, aligning with the MVP philosophy of doing more with less.
To sum up, the database is structured to support quick queries for the frontend (fetch summaries and sources) and efficient operations for the backend (insert articles, find similar articles via embeddings). Each table has a clear purpose in the pipeline, and unnecessary normalization or complexity is avoided for now. This design can evolve (for instance, splitting out summary or adding user tables if needed later), but it covers our current needs with minimal moving parts.
9. Feature List (User-Facing)
From the user’s perspective, the MVP provides a clean, no-nonsense news experience. Below is the list of main user-facing features and how they behave:
Homepage Feed: The homepage is a feed of summarized news incidents (stories). Each item on the feed corresponds to a cluster of sources about one event. By default, the feed might show a mix of the latest and potentially most significant stories, likely sorted by time (most recent first) or a slight prioritization of very important news. Each feed entry displays:


A headline or short title for the incident (e.g. “Major Power Outage Hits Colombo Suburbs”).


A brief summary snippet (first sentence or two of the summary) in the user’s chosen language (English by default, but see language switching below).


Metadata: time of last update (e.g. “Updated 2 hours ago”) and possibly an indicator of how many sources (e.g. a small label “3 sources” to subtly convey it’s aggregated).


A click/tap area or “Read more” button that takes the user to the full incident page.


The feed will continuously reflect updates. If the user leaves it open, we might not implement live auto-refresh in MVP, but a simple manual refresh will show newly added stories. We ensure the feed loads fast by only showing summaries (no heavy media by default, unless an image feature added later, but likely not in MVP).


Incident Detail Page: When a user clicks a story, they see the dedicated page for that incident (cluster). Here we present:


The full combined summary in the chosen language. This will typically be a few concise paragraphs or bullet points capturing all key facts.


A list of sources that were used. This could be shown at the bottom or side. For example: “Sources: Daily Mirror, Ada Derana, BBC Sinhala” with each source name linked to the original article or post. This feature is crucial for transparency; users can verify and read more if they want. It also demonstrates our multi-source basis upfront.


If the story has been updated since first published, an “Updated on [time]” note might be displayed below the headline, so users know the summary accounts for new info.


Possibly, if multiple languages are available, a small note like “Also available in Sinhala / Tamil” to hint that they can switch language (though we’ll have a more direct control for that).


The design will be minimalistic: just the text and links. We’re focusing on content, not lots of images or ads, etc., in MVP.


Language Switching: A prominent feature is the ability to switch the summary language seamlessly:


Likely, at the top of the site or as a toggle on each page, we have language options (e.g. [EN] [සිං] [தமிழ்]). If the user clicks “සිං” (Sinhala), the summaries on the page (whether feed or incident detail) will toggle to Sinhala version. Technically, we can load all three versions on page load (since they’re short text) or fetch on demand from the database when switched.


The switch applies globally for that session – meaning if you choose Sinhala on the homepage, when you click into a story, it should show Sinhala summary by default. We can manage this via a URL parameter or a simple client-side state.


This feature is critical to make the app tri-lingual without fragmenting the user base. Everyone’s looking at the same stories, just in their chosen language.


On a design note, switching languages will only change the summary text (and maybe UI labels), but it won’t change the source list (source names will remain in their own language, which is fine).


We ensure the Sinhala and Tamil fonts render correctly and are readable on all devices – a basic but important detail for usability.


Source Transparency & Detail: Each summary will have a clear indication of the sources. Our approach to source transparency in UI:


On the feed item, we might not list sources to keep it uncluttered (maybe just the count). On the incident page, we list source names (with hyperlinks).


We might also include small icons or favicons of the news sites next to names for visual recognition, if easy to implement (not crucial for MVP though).


When a user clicks a source link, it opens the original article in a new tab. This way, if someone wants full context or to verify wording, they can get to it immediately.


By highlighting sources, we address the trust: users see we’re not making things up; everything is backed by known outlets. It’s a differentiator from e.g. random AI summaries with no citations.


If a story is sourced entirely from, say, social media posts (in rare cases), we’ll list those as well (e.g. “Twitter (@username) post at [time]”). But again, MVP will mostly have mainstream sources listed.


Update Indicators: Since stories can evolve, we want users to notice if something changed:


For a story updated within, say, the last hour, we could highlight it on the feed (maybe a small “•” or “Updated” badge). This draws attention to developing news. If it’s been a while, we might just rely on the timestamp.


On the incident page, as mentioned, an “Updated [time]” label can appear near the top.


Additionally, if the summary itself has internal updates (like added context), the text will reflect that (e.g. “(Updated) The ministry later announced…”) but that’s part of summarization content.


If the user had previously read a summary and returns, they might not notice what changed. MVP might not highlight diffs in content, only the fact of an update. In the future, maybe we could highlight new sentences.


Also, a subtle use-case: If a cluster only had one source and thus wasn’t shown initially, and later a second source appears turning it into a summary, that story might “pop up” as new on the feed. That’s fine, it will just look like a new story (when in reality it was quietly waiting for confirmation).


Performance & Simplicity in UI: The user-facing features intentionally avoid heavy functionality that could slow down or complicate the MVP:


No search bar (for MVP). Users can’t search archives or topics yet; they just scroll the feed. This keeps things straightforward. (Search could be a future feature, leveraging the DB and vectors, but not now).


No user comments or sharing features built-in aside from maybe a share link (they can always copy URL from browser).


No notifications or personalized “favorites” in MVP UI.


Responsive design is considered a feature: Many users (especially diaspora or younger users) will view on mobile. We ensure the site is mobile-friendly (Next.js and modern web make it easy to be responsive). Summaries are short paragraphs, which should fit well on small screens without endless scrolling.


Error/Empty States: If, say, no stories are available (maybe early in the product or if pipeline fails), the homepage might show a friendly message like “No news available at the moment, please check back later.” Or if a particular summary fails to load, we handle gracefully.


But given our pipeline design, the DB should always have something (we might seed it with a test story at start).


Visual Design and Branding (basic): Although not a “feature”, worth noting:


We’ll use a clean theme (e.g. light background, legible font for Sinhala/Tamil Unicode text).


Possibly color-code or label languages for clarity (maybe a font or a tag showing “EN” etc when switched).


We’ll ensure Sinhala and Tamil text are properly aligned (likely need to ensure we use web fonts that support those scripts, or system fonts fallback).


In essence, the MVP’s user-facing feature set is minimal but targeted: a unified news feed where each item is an aggregated story that can be read in multiple languages. The emphasis is on the content (summaries) and credibility (sources, updates), while keeping the interaction simple (click, read, switch language). This provides immediate value: as a user you land on the site and in seconds see the top stories with credible summaries you can trust. There’s no need to configure anything or learn complex features. The product’s differentiation – multi-source neutrality – is conveyed by those source lists and the style of writing, which are front and center.
10. Non-Functional Requirements
Beyond features, the MVP must meet certain non-functional criteria to be viable and reliable. We outline the key non-functional requirements (NFRs) and our targets for each:
Performance: The system should feel snappy to users.


Backend: The pipeline should be efficient enough to process incoming news without significant delays. Our goal is that from the time an article is published on a source to the time our summary appears is at most 5-10 minutes (assuming it was the second source needed for a story). Clustering and summarization operations should take seconds, not minutes, on average. If using OpenAI, a single summary generation might take a couple of seconds of API time; that’s acceptable.


Frontend: Page load times for the feed and story pages should be low. We aim for initial load < 2 seconds on a typical connection. Next.js can pre-render content and use CDN caching, so largely we serve static pages that are very fast. Summaries are short text, negligible in size, so payloads are small. We avoid heavy images or scripts. Scrolling through the feed should be smooth (we might only show, say, 20 latest stories, with an option to fetch older if needed, to avoid a massive DOM).


Scalability (to a point): While MVP likely has a small user base, we design with some headroom. Supabase (Postgres) can handle concurrent reads easily in the hundreds or thousands, which is plenty for MVP. Vercel can scale the front-end globally. The main heavy operation is the OpenAI calls and if, say, we had a spike of news events (imagine during an election night with dozens of updates), our pipeline might back up. We might impose a limit (like only process up to X new stories per minute) to avoid overload/cost explosion. But overall, the volume in Sri Lankan news is manageable for our pipeline design.


Cost Efficiency: As a small startup/solo founder, cost control is critical.


We leverage free tiers as much as possible: Vercel’s hobby plan for hosting (which can handle a decent amount of traffic and scheduled functions), Supabase’s free tier (which provides a managed Postgres and some storage – likely enough for MVP data volumes).


The significant cost could be OpenAI API usage. We estimate the number of summaries per day: Suppose ~50-100 news clusters a day during busy news cycles. If each summary (English + 2 translations) uses maybe 1000 tokens, that’s a few cents each at most. Even at 100/day, we’re talking a few dollars a day at most. Our target is to keep monthly AI cost under ~$100 for MVP stage, ideally much less. We’ll use GPT-3.5 for summarization if it’s sufficiently good, since it’s cheaper, and reserve GPT-4 for complex cases. Also, by only summarizing when multiple sources are present, we reduce calls.


We avoid other paid services; for instance, if possible we won’t use an expensive News API subscription since we can scrape RSS ourselves (with caution to not violate any terms or heavy load on sites).


Monitoring costs: we’ll implement basic logging of how many API calls we make, and have alerts if usage spikes unexpectedly (maybe an anomaly like a clustering bug causing repeated summarizations – we want to catch that).


Rate Limiting & API Usage: Both incoming and outgoing:


Fetching sources: We must respect source websites by not hammering them. RSS feeds update maybe a few times an hour at most for news sites. Polling every 5-10 minutes is usually fine, especially if we use conditional GETs (some feeds allow checking a last-modified date). For social media, if using APIs, we have to respect their rate limits (e.g. Twitter’s API might allow X calls per 15-min window – but since we track only a limited set of accounts, the volume is small).


We will schedule fetches in a staggered manner if needed to avoid a spike (for instance, don’t fetch all 50 sources at the exact same second – spread them over a few minutes).


OpenAI API: They have rate limits per minute depending on the plan. We likely won’t hit these with our scale, but if we did (say an event triggers 30 summaries at once), we might queue them with slight delays or throttle ourselves to comply.


User side: If the site ever provides an API or if heavy usage occurs, we might add rate limiting to prevent abuse (not likely needed at MVP scale – and no open API in MVP). But the web app should handle being crawled or refreshed often gracefully.


Also, Supabase has limits on request rates (free tier around 200 requests per second or so); again, we won’t approach that with normal usage.


Legal & Copyright Considerations: This product operates by summarizing content from other publishers, so we must tread carefully:


Fair Use / Fair Dealing: Summarizing news articles is generally considered fair use/fair dealing in many jurisdictions if done for the purpose of informing (transformative use). We ensure our summaries are not too long (they should not substitute for the full article for someone who wants depth, but rather give the gist). We also always credit sources and link to them, which is a good-faith gesture and can drive traffic to them, alleviating concerns that we’re stealing their content.


We avoid copying any verbatim sentences from articles (unless it’s a short quote in the context of news). The AI abstractive summary helps here – it writes in original phrasing. Any direct quote from a person (like a statement by an official) that appears in the summary should ideally be attributed (e.g. “The Prime Minister said ‘…’ in Parliament,”) and that’s standard news practice.


For social media content: If we use a tweet’s content, we might quote it or describe it, which should be fine if it’s factual (like quoting an official statement from Twitter).


We should check if any publisher’s terms explicitly forbid automated summarization or scraping. Many have RSS precisely to encourage sharing snippets. Using RSS is generally within allowed use (they often provide headlines and maybe short descriptions knowingly). For full text scraping, it’s murkier. We might limit to using content that is openly available and not behind paywalls. If a site has paywalled content, we likely won’t include it (both to avoid legal trouble and because we can’t access it anyway). Stick to free news sources and official info.


Copyright of Summaries: The summary we produce is original content (AI-generated based on facts). However, we might consider the copyright of the underlying content. To be safe, we might include a disclaimer on the site: “All summaries are based on content from cited sources. Original articles are copyright their respective owners; summaries are provided for informational purposes.” This clarifies we’re not claiming ownership of the original reporting.


Licensing with Publishers: Not needed at MVP but if scaling, we’d consider partnerships (like Particle did with licensing dealsnewsroomrobots.com).


Security:


Data Security: User data is minimal (no logins, no personal info stored). The main sensitive part might be API keys (OpenAI, maybe social APIs). We will keep those in secure environment variables on Vercel, not in the code repository. Supabase credentials likewise should be stored securely.


Preventing Injection/Attacks: Since we display content that was scraped, there’s a risk an article might contain malicious HTML or script. We will sanitize any HTML content from RSS (most RSS feeds give plain text or simple HTML which we can strip to just text). The frontend will not dangerously render any HTML from sources. We likely only display our summary text and maybe use source links safely (with rel="noopener" etc.). So XSS risk is low if we clean input.


Secure Access: Supabase will be accessed either through server-side calls or using its Row Level Security if direct from client. We’ll likely hide any service role keys and only use anon key for public data, with RLS policies to ensure only allowed data can be read (maybe all data is public anyway in this case).


Denial of Service: Not a big concern at MVP audience, but if someone tried to spam hitting our site, Vercel’s infrastructure can handle a lot and we have no stateful session to exhaust. If they spam our backend API (Supabase), that could be an issue if it saturates query limits. We could implement basic rate limiting per IP via Vercel middleware if needed.


Admin Access: We might have an admin page or not in MVP (maybe not). If we do, ensure it’s behind proper auth (Supabase provides an auth or we restrict by IP for admin). But likely MVP admin is just directly checking DB or logs.


Reliability and Uptime:


We aim for a reasonable uptime for a prototype. Vercel and Supabase are managed services known for high uptime on free plans. Still, we design such that:


If the pipeline fails, the user site still shows last known content (could be slightly stale but not broken).


If Supabase goes down, the site would fail to fetch data – not much we can do but it’s rare. Perhaps cache last results in memory or static generation to mitigate short outages. We could ISR (Incremental Static Regeneration) the homepage every few minutes such that even if DB is down, users might get a prerendered static page. Something to consider if easy.


Error Monitoring: We will use console logs and maybe integrate Sentry or Supabase’s monitoring to catch errors. If an OpenAI call fails often, we want to know. If clustering logic throws, we want to fix it promptly. Quick iteration and fixes are expected in MVP cycle.


Privacy:


We handle no personal user data, so compliance like GDPR isn’t directly an issue. We might still have a privacy policy stating we don’t collect personal info or tracking beyond basic analytics perhaps.


If we use any analytics (e.g. simple page view count), we’ll ensure it’s privacy-respecting (maybe use a simple no-cookie analytic or none at first).


The content we handle (news) is public, so no privacy issues there.


Ethical AI Use:


Our AI usage will be transparent (we won’t hide that summaries are AI-generated, if asked). Part of trust is not deceiving users. Perhaps in an “About” page we mention that we use AI to compile news but sources are always cited and we strive for accuracy.


We should also ensure the AI doesn’t produce problematic content. Given it’s summarizing known news, it should be fine. But if sources have inflammatory language, we expect our summarizer to tone it down to factual description. We’ll keep an eye to ensure neutrality (e.g., if a source uses a derogatory term, the summary should probably avoid it or put it in quotes as an event).


In summary, our non-functional goals are to make the MVP fast, reliable, and safe within the constraints of a lean startup. We rely on managed services to cover a lot of these (Supabase for security and performance of DB, Vercel for scalable hosting, OpenAI for robust NLP so we don’t host a model). We constantly balance cost vs performance: e.g. using caching and efficient queries to keep both speed and cost in check. Lastly, we abide by legal and ethical norms to ensure this trusted news service is itself trustworthy in how it operates.
11. MVP Development Roadmap (30–60 Days)
To build this MVP within roughly 1-2 months, we break the work into weekly sprints with specific goals and deliverables. Here’s a realistic roadmap:
Week 1: Project Setup & Basic Ingestion


Goals: Set up the development environment, repository, and basic infrastructure. Get a “Hello World” feed ingestion working.


Tasks:


Initialize Next.js project on Vercel. Set up Supabase project (Postgres DB) and connect to Next.js.


Create the core tables (sources, articles, etc.) using Supabase migration or SQL scripts.


Write a simple script/function to fetch from one example RSS feed (e.g. Daily News or Colombo Page) and store an article in the DB.


Verify data is saved correctly (title, content, etc.) and can be retrieved.


Deliverable: By end of week, we should have a dummy page that lists articles from the DB (no clustering or summaries yet, just raw titles perhaps), proving we can ingest and display data.


Week 2: Multi-Source Ingestion & Deduplication


Goals: Expand to multiple sources and ensure duplicates are handled.


Tasks:


Populate sources table with, say, 5-10 RSS feeds (covering English, plus maybe one Sinhala and one Tamil news site if available).


Implement a cron job (using Vercel’s @vercel/cron or a scheduled API route) that goes through each source, fetches new items, and stores them. Use unique constraints to skip those we’ve seen.


Implement content cleaning (strip HTML tags, etc.) and possibly language detection tagging.


Add logic for near-duplicate detection: e.g. if two articles have the same title or content hash, mark them as duplicates or skip adding the second. At least log duplicates for analysis.


Test with actual feeds to ensure we aren’t ingesting junk or crashing on any format.


Deliverable: Cron-based ingestion is running reliably (maybe manually triggered for now). By end of week, the database should be filling with real articles from multiple sources, without obvious duplication.


Week 3: Clustering Mechanism


Goals: Implement grouping of related articles into clusters (without AI yet).


Tasks:


Enable pgvector on Supabase and ensure we can generate embeddings. Possibly use OpenAI’s embedding API or a local model via a script for each article.


Write the clustering function: for each new article, find similar existing articles by vector similarity. If found, assign cluster_id; if not, create new cluster.


Alternatively/Additionally, use simple keyword matching for validation (e.g. ensure that similar vectors also share a keyword, to avoid weird false matches).


Update the schema: maintain cluster_id on articles or a cluster mapping.


Write cluster creation logic and store basic cluster info (maybe provisional title = first article title, and updated timestamp).


Test by simulating a known story from different sources and see if they cluster together.


Deliverable: By end of week, we should have cluster IDs being assigned. We can run a test: fetch a bunch of articles and then query clusters to see if multiple articles ended up with the same cluster_id (meaning clustering worked). Possibly output a debug list of clusters and their member titles for verification.


Week 4: AI Summarization Integration (English)


Goals: Connect OpenAI API and generate summaries for clusters.


Tasks:


Set up OpenAI API key in environment. Using either their Python API via a small script or directly from Next.js backend.


Write a function to produce a summary given a cluster’s articles. Start simple: concatenate the content (or key sentences) and prompt GPT-3.5 to summarize.


Emphasize neutrality and brevity in the prompt. Possibly test with a known cluster to see output quality.


Store the resulting summary in the DB (summary_en). Possibly add a summaries table or use clusters table as decided.


Integrate this into the pipeline: after clustering, for each new cluster or updated cluster, call summarization.


Handle errors: e.g. if OpenAI fails, just skip that cluster for now.


Deliverable: By end of week, we should be able to automatically generate an English summary for at least some clusters. We can manually inspect a summary and compare it to sources to ensure it's factual. Also, the cluster detail can now show that summary text.


Week 5: Frontend Display of Feed and Stories


Goals: Build out the Next.js pages for homepage feed and story details, using data from Supabase.


Tasks:


Design a simple homepage layout. Use Supabase client (or an API route) to fetch recent clusters (with summary, title, updated time, source count).


Render a list of stories with their title, short snippet (first line of summary), and maybe time.


Make each item clickable (Link to a dynamic route like /story/[id]).


Create story detail page: fetch the cluster by ID, display full summary and list of sources (names and links).


Implement basic styling (maybe Tailwind or simple CSS) for readability.


Pagination or infinite scroll not needed if we just show, say, last 20 stories. But ensure older ones can be accessed (maybe just link to a “more news” that shows older ones in descending order).


Deliverable: By end of week, one should be able to navigate the running app: see a homepage with summarized stories and click through to read the full summary and sources. The content will be in English only at this point. This is a major milestone where the product is basically browsable.


Week 6: Multilingual Support


Goals: Generate Sinhala and Tamil summaries and implement language toggle on frontend.


Tasks:


Use OpenAI or another translation method to get Sinhala and Tamil versions of each summary. Perhaps create a function translate_summary(cluster_id, target_lang) that either prompts GPT with the English summary to translate or re-summarize using original content in that language (likely translate).


Populate summary_si and summary_ta in the DB for clusters. This could be done immediately after English summary generation in pipeline.


Ensure encoding is handled (Sinhala/Tamil characters stored properly in Postgres – should be fine with UTF-8).


On the frontend, add a language switcher component. Perhaps store chosen language in a React context or simply in local storage.


The feed should detect chosen language and display summary_si or summary_ta accordingly. Similarly for detail page.


Double-check that lengths of text still look okay in UI (some expansion might occur in translation).


Do a review with a native speaker if possible to ensure translations read well (not too literal or weird).


Deliverable: By end of week, a user can toggle to Sinhala or Tamil and see the summaries in those languages. The site should effectively function in three languages (for the news content; UI labels might remain English or we can static translate those too for completeness). We now have the core value prop implemented.


Week 7: Refinement and Additional Sources (Buffer week)


Goals: This week acts as a buffer to refine any issues, improve accuracy, and possibly add more sources or social media integration.


Tasks:


Go through the pipeline logs and fix any glaring issues (like certain feeds not parsing correctly, or clusters merging incorrectly).


Adjust clustering thresholds if needed to reduce false grouping or missed grouping.


Fine-tune the summarization prompt or approach if some summaries are not neutral enough or missing info. For example, if we notice the AI dropping a key detail, maybe adjust prompt to bullet important points first.


Add a few high-value social media sources: e.g. incorporate Twitter feeds of few key accounts using their API or an RSS proxy. Test that we can fetch and treat those posts like articles (with content = tweet text).


Increase the source list to desired breadth (maybe up to 20-30 sources including Sinhala and Tamil media). Ensure performance still okay.


Implement the “updated” indicators on frontend if not done (like compare cluster first_seen vs last_updated times).


Polishing UI: make sure mobile view looks good, add any branding elements (like a name/logo text).


Deliverable: By end of week, the system should be robust and polished. We should be comfortable demoing it to a small user group. All core scenarios (multiple sources, conflicting info, updates) should have been tested at least in simulation.


Week 8: Testing, Feedback, and Launch Prep


Goals: Conduct thorough testing and incorporate final feedback. Prepare for soft launch.


Tasks:


Testing across the board: unit test some functions (if time permits), but mostly integration testing. Simulate a breaking news by adding dummy articles to see if summary updates correctly. Test what happens if one source has an outlier fact.


Cross-browser and device testing of the UI (Chrome, Firefox, mobile browsers).


Security check: ensure no sensitive info in client, test that direct DB access is secure (RLS or only exposing needed data).


Gather a few friendly users (maybe our personas in real life: a student, etc.) to try the app and give feedback. See if they find it useful and if they notice any issues (e.g. “Sinhala summary is a bit unclear here” or “I wish I could…X”).


Implement small improvements from feedback if they are quick wins (for example, if users want a dark mode and it’s easy with CSS, maybe do it).


Prepare launch materials: a simple intro message on the site (an About page, explaining this is beta and summarization is AI-driven so some errors might exist, inviting feedback).


Deliverable: A ready-to-launch MVP by end of week 8. At this point (Day ~56), the product documentation (like this document) is also finalized, and we have a plan to announce or onboard initial users.


This roadmap provides a structured path. It’s aggressive but realistic given the small scope and use of existing services. Each week builds on the previous, with crucial functionality (clustering, summarization, multi-language) tackled sequentially. We also left some buffer (Week 7) for unexpected issues which always occur (maybe integration difficulties or prompt tuning). By having a live prototype by mid-way (Week 5), we ensure we have time to iterate on the quality of summaries and clustering with real data in the remaining weeks.
We will be continuously integrating and deploying (CI/CD) with Vercel, so every new feature can be tested live quickly. By the end of 60 days, we aim to have an MVP that could be shown to early adopters or even a public beta, fulfilling the core idea as described.
12. Success Metrics
To evaluate the MVP’s performance and impact, we will track a variety of metrics. These span product success (are users finding value?), content accuracy, user engagement, and technical health.
Product Success Metrics:
Daily Active Users (DAU): How many unique users visit the site per day. As an MVP, even dozens of real users daily would indicate interest. We aim to get, say, 50-100 DAUs in the first couple of weeks of beta via word of mouth.


Retention Rate: Do users come back? E.g., 7-day retention: the percentage of users who return within a week for another session. A high retention (30%+ returning next week) would show the product is becoming a habit (especially for daily news, we’d like to see consistent use).


Time Saved / Satisfaction (qualitative initially): Since our value prop is saving time and providing trust, we might gather feedback via a simple survey or interviews. A metric could be “self-reported time to get news” or “user rating of trustworthiness”. For instance, asking users to rate 1-5 if they trust the summaries. We’d like an average >4 if possible, but initially we’ll qualitatively note feedback like “I no longer need to open 5 sites every morning” as success indications.


Accuracy Metrics:
Summary Accuracy Score: We can do an internal audit where we randomly pick, say, 20 summaries per week and manually verify each fact against sources. We then score them (e.g. out of 10 facts, how many correct). We would aim for a very high accuracy (90%+ facts correct). If any summary has a major error (false fact), that’s a red flag. Initially, we expect to catch and fix issues, but by MVP release we want zero major factual errors in published summaries.


Multi-Source Confirmation Rate: The proportion of summaries that are actually derived from 2 or more sources (as opposed to single-source). We want this to be high because it indicates we truly are multi-sourcing. If it’s low, it means our threshold or news volume might be causing a lot of single-source stories slipping in. For trust, let’s target >80% of feed items have 2+ sources behind them.


Correction Rate: If we have a mechanism for users or editors to flag inaccuracies, we track how often corrections are needed. Early on, we may manually correct something if found wrong. We measure how many such interventions over number of stories. Ideally, this is very low (<5%). Frequent corrections would indicate a need to adjust AI or data handling.


Latency of Updates: A metric like average time between second source arrival and summary updated. If, say, second source comes in at time T, and our summary is live by T+10min, that’s good. We can log the timestamps in DB and compute an average. We might target under 15 minutes mean latency for multi-source stories (some delay is fine, but if it’s too slow users might see news elsewhere first).


Engagement Metrics:
Sessions per User: How often does a user check the site in a day/week. For news, an engaged user might check daily or multiple times daily if content updates often. This metric indicates stickiness.


Pages per Session: If users typically only see the homepage or if they click into details. For example, we track pageviews of story detail vs homepage. If every session includes multiple story views, it means users are interested in reading more than headlines. If not, maybe the summary on the homepage was enough or they left quickly.


Bounce Rate: If many users hit the homepage and leave immediately, either they got what they needed (which might not be bad if the summary on front was enough) or they weren’t satisfied. We interpret carefully: A low bounce (they explore further) usually means higher interest. But given our model, it might be okay if someone reads all headlines on homepage (which are full summaries) and leaves because they got their info.


Preferred Language Split: What percentage of users read in Sinhala vs Tamil vs English. This will inform if our multilingual feature is heavily used. For example, if 50% of sessions switch from English to another language, that’s a huge validation of that feature. We can get this by tracking toggle events or by seeing which language version of summary endpoints are requested more.


Source Click-throughs: How often do users click the source links to read full articles. If this number is low, it means our summary was probably sufficient (or users trust it and don’t feel the need to verify). If it’s high, users might want more detail or are skeptical and want to check. We’d monitor this: maybe ~10% of story views result in a click-out to sources. If it’s near 0%, we delivered all needed info; if 50%+, maybe we are leaving out details or users don’t fully trust the summary.


Sharing or Word-of-Mouth (if trackable): We might not have share buttons now, but if we see users coming from external links (someone shared a story URL on social media), that indicates interest. We can measure referrals or direct traffic spikes. Not a direct metric, but qualitatively observed.


Technical Health Metrics:
Uptime: We’d measure if the site had downtime (via simple ping or monitoring). We target 99%+ uptime in MVP (some downtime might happen if we redeploy, but Vercel handles seamless deployments usually).


Pipeline Success Rate: Percentage of scheduled pipeline runs that complete successfully. If we schedule 144 runs a day (every 10 min) and 140 run fine, that’s ~97% success. We want to minimize failed runs. We log if a run fails and monitor. Ideally 95%+ of cron jobs run without errors. Also track if certain sources consistently fail to fetch.


Error Logs: Number of uncaught exceptions or errors in the log per day. Ideally near zero in production. We may set up a simple alert if any error occurs in the background or frontend.


Response Time: The serverless function response time for pages or any API endpoints. Next.js pages likely cached, so <200ms. Supabase queries should be millisecond-level for our scale. We’ll keep an eye that no query is unexpectedly slow (like vector search might slow if not indexed – we’ll index it).


OpenAI Usage & Cost Monitoring: Not exactly a user metric, but internal: ensure our monthly usage is within budget. For technical success, we do not want to burn out credits. We might set a metric like “cost per 100 summaries” and ensure it’s as expected. Or track average tokens per summary to see if prompt is too verbose.


Qualitative Metrics (to complement above):
We plan to solicit feedback from initial users. Net Promoter Score (NPS) could be a simple measure: would they recommend this to others? If early adopters give high NPS, that’s promising.


Also, any anecdotal evidence (like a teacher saying “my students started using this daily”) is a success indicator for us.


To sum up, success for the MVP looks like this: A small but growing user base that finds the summaries useful and trustworthy (shown by repeat usage and positive feedback), content that is accurate and timely (few if any errors, summaries updating quickly as news evolves), and a system that runs smoothly (no major outages or cost overruns). If our metrics show that people are indeed using and relying on the product regularly, and that we aren’t running into technical or accuracy issues, then the MVP can be deemed successful and we can start thinking about scaling and extending it.
13. Risks & Mitigation
Every new product comes with risks. We’ve identified key risks across different categories and how we plan to mitigate them:
Technical Risks:


Integration and Data Fetch Failures: There’s a risk that some news sources might not have reliable RSS feeds or that social media APIs change or restrict access. If our pipeline can’t fetch data consistently, the product fails. Mitigation: We use multiple sources so no single point of failure; if one feed fails, others still provide news. We’ll also implement robust error handling and retries in the pipeline. For crucial sources, we might set up alternative methods (e.g. scrape HTML if RSS fails, though that’s a last resort). We also keep our source list flexible – if one proves too problematic, we can replace it with another.


Clustering Accuracy Issues: Our algorithm might incorrectly cluster unrelated stories or fail to cluster related ones (especially if wording differs a lot). Mitigation: Start with conservative criteria for clustering (e.g. require certain similarity threshold) to avoid egregious misgrouping. Monitor cluster outputs manually in early stages and adjust thresholds or add keyword checks. For missed groupings, we might implement a secondary check (like if two clusters have very similar centroid embeddings, merge them). Since MVP volume is not huge, we can also manually correct any obvious mistakes in the interim.


AI Summarization Errors/Hallucinations: The model might produce content that’s factually wrong or phrased in a biased way. This is both a trust and technical risk. Mitigation: Use multi-source input and strong prompts as discussed. Also possibly use the “Reality Check” approach of verifying claimsnewsroomrobots.com – if not automated in MVP, at least manually check initial outputs. We might keep the model to GPT-3.5 which, while slightly less fluent, sometimes sticks closer to input phrasing (reducing wild creativity). If hallucinations persist, one fallback is to switch to a more extractive summary approach (e.g. list key points from sources directly) until we refine the AI prompts.


High Latency or Downtime: If our pipeline or API calls are slow, summaries might not be ready when needed. Also, heavy reliance on third-party (OpenAI) means if they have an outage, our summarization stalls. Mitigation: We can cache results to not need repeated calls. If OpenAI is down, the pipeline can queue until it’s back. We could also integrate a backup summarization model (like an offline model, albeit quality might drop, this is more for contingency if OpenAI was unreachable for a long period). For the site, we leverage Vercel/Supabase which are quite stable. We will also set up basic monitors (even just a healthcheck ping) to catch downtime quickly and respond.


Scalability Limits: If usage unexpectedly grows (a good problem), our free-tier choices might strain. Too many requests could hit Supabase limits or OpenAI costs could spike. Mitigation: We’ll keep an eye on usage. Supabase can scale to a paid tier easily if needed (the cost is manageable for moderate growth). We also can implement caching on the Next.js side (ISR caching pages) to reduce DB calls per user. For OpenAI, we have hard limits by design (not summarizing every single article, only clusters). If we did scale, we could consider summarizing fewer things or increasing the threshold of when to summarize to control volume.


Trust & Content Risks:


Bias in Sources: Our summaries are only as neutral as the sources we include. If our source list unintentionally leans politically one way (or excludes an important perspective), summaries might inherit bias (e.g., consistently using one side’s terminology for an issue). Mitigation: Curate a balanced set of sources (state-run, private independent, international, etc.). Also, if bias creeps in (detected via user feedback or our review), consider adding sources to counterbalance or adjust the prompt to neutralize language. For example, if one source uses very emotional language, the summarizer should ideally tone it down, but if not, we manually intervene in prompt.


Misinformation Spreading: If our system picks up a false report from one source and it happens to have confirmation from another unreliable source, we might inadvertently summarize something untrue. Mitigation: Stick to generally reputable sources (this reduces chance of outright fake news). Also, incorporate the conflict-check: if a wild claim is only on one site, it won’t be included until verified elsewhere. If two sources share it but later it’s debunked, we need to update – part of our update mechanism. Essentially we have to respond quickly to correct info. Also, we might include in the summary wording like “<Claim> was reported by [sources]” rather than stating as fact, if we suspect it might be questionable.


User Trust & Adoption: Users might be skeptical of AI summaries or of the site they haven’t heard of. Earning trust is slow; any early mistake could lose users. Mitigation: Transparency is key – always show sources, keep the tone factual. Possibly include an “About us / methodology” page explaining we use AI and multiple sources. People often trust something if they see it’s pulling from sources they recognize. We might also not market it as “AI news” heavily to users, instead emphasize “multi-source news digest” (the AI is a means, not the brand). Building a small loyal user base through personal networks and getting testimonials could help.


Language Quality Concerns: If the Sinhala or Tamil summaries sound awkward (AI might not be perfect in those languages), it could turn off users or cause misunderstanding. Mitigation: Test with native speakers and iteratively improve prompts or even consider using a human translator for the most critical summaries during MVP if we find too many errors (not scalable, but for MVP quality assurance). If needed, we could default to just English if we find the local language output is subpar, but that’d undermine our USP, so we try to get it right. Perhaps focusing on formal written style in prompt helps as the model might do better with that.


Over-reliance on AI (trust risk): If something goes wrong (like AI omits a critical bit), users might not realize and be less informed. Mitigation: Encourage source clicking for full info, especially for complex stories. Also, we could set a policy that for really important stories (life/death info, safety warnings) we double-check or even manually write a note. For instance, if a natural disaster happens, we might want to ensure info like emergency numbers are not omitted. This could be something to think about; maybe keep those in sources or ensure summarizer knows not to exclude such details.


Legal Risks:


Copyright/IP Complaints: A news publisher might see our site and claim we’re deriving content from them without permission, possibly hurting their ad revenue (since users read our summary instead of their page). While we believe our use is transformative fair use, it could lead to complaints or requests to cease. Mitigation: We prominently credit and link to all publishers. This can mollify many, as we might drive traffic to them for details. If any publisher formally complains, we can remove their content from our system (since we have a modular source list). It won’t break our app to drop one source. We would prefer to have good relations, maybe explain the value we add (especially if our summaries lead readers to click through for more depth). As a small MVP, likely we fly under radar or are seen as beneficial aggregator.


Privacy and Data Protection: Though we don't handle user data, if we were to implement analytics or logs, we must ensure compliance with basic privacy law (especially if any EU users might access). Mitigation: We can use privacy-friendly analytics (no personal data) or none initially. Ensure any user feedback form we might add doesn’t collect sensitive info without consent.


Regulatory Environment: In some countries, news aggregators have faced requirements (like Google News in EU had to license snippets). Sri Lanka doesn’t currently have that, but we should be aware. Mitigation: Keep summaries short and clearly separate from original content. If regulations around content reuse tighten, adjust accordingly, possibly moving to a model where we license content if needed or ensure we’re within allowed usage.


Product/Market Risks:


User Adoption Risk: It’s possible that, despite solving a clear problem, users might not switch habits to use our product. Google News or social media feeds might suffice for them, or they might not trust a new brand. Mitigation: Target the niches that have the pain point acutely (diaspora on Reddit like the guy who built rongo.lk reddit.com – these users actively seek solutions). We'll gather those early adopters, maybe through targeted online communities (r/srilanka, Twitter). Their positive experience can help spread usage. Also highlight differentiators: multi-lingual and neutral; local aggregators typically haven’t offered that.


Content Breadth: Maybe in MVP we cover major news well, but users might ask “Hey, why isn’t X story here?” If our sources missed something or our clustering failed, user might lose faith. Mitigation: Ensure we have broad source coverage so we rarely miss a story that’s widely reported (the clustering might miss initial single-source stuff, but by design because we want multiple sources). We can explain that if something’s not there, it might be a single-source claim or we’re verifying. Possibly have a feedback channel for “report missing story” which in MVP could just be an email.


Competition: What if bigger players or new apps (like Flux, or some local startup) are doing similar? Users may have alternatives. Mitigation: In MVP, focus on executing well in our niche. Our understanding of local languages and context can be our edge over generic apps. We keep an eye on competition but as a small startup, we mainly worry about serving users well; if we do that, we can carve out loyalty.


Each risk above we treat proactively. Because trust is fragile, our overriding principle is transparency and quick correction. If a mistake or issue arises, we’d rather be upfront (perhaps even a note “this summary was updated due to a correction”) than silent. This way early adopters learn that we are striving to be reliable and accountable.
Finally, we remain flexible. MVP is about learning – if a risk manifests (like users not liking AI tone, or a source complaining), we adapt rapidly, whether that’s adjusting the tech or the feature set. By anticipating these risks, we hope to avoid most and handle the rest calmly.
14. Future Extensions (Not in MVP)
While our focus is the MVP scope, we have a vision for how the product could evolve beyond the initial launch. These are features and paths we deliberately postpone now but see as promising for the future:
Monetization Paths: Currently, the product is free with no ads. In the future, to sustain the service, we could explore:


Subscription Model: Offer a premium tier for power users or institutions. For example, a paying user might get advanced features like personalized news digests, deeper archive search, or faster alerts. Diaspora or research professionals might pay for an ad-free, customizable experience.


Sponsored Content or Native Ads: If done carefully, we could have sponsored slots (clearly marked) in the feed. However, given our neutrality stance, we must ensure ads don’t bias content. Perhaps focus on relevant educational or service ads (like language learning, etc., for diaspora) that align with user interests without compromising trust.


Data/API Licensing: Over time, our database of summarized factual news could be valuable (the “facts layer” conceptnewsroomrobots.com). We could license an API to other apps or services (e.g. a university might want to pull our summaries into their LMS, or a voice assistant could use our feed to read news briefs). This could be a B2B monetization route.


We’d validate willingness to pay only after we have an engaged user base, as jumping to monetization too early could hurt growth.


Student & Exam-Oriented Features: Since students are a target group, we can build on that:


Archived News by Topic: For exam prep, students might want to review events over the year categorized by subject (politics, science, international). We could tag clusters by category and offer browsing by category or even “year in review” collections.


Quizzes and Q&A: We could implement a quiz mode where after reading a summary, students can take a quick quiz (possibly AI-generated questions from the summary) to test retention. This makes studying news more interactive.


Integration with Curriculum: If certain current events are relevant to A/L subjects like General Knowledge or General English, we could highlight those. Even providing context boxes or explainers for complex news (like a brief background on a conflict) could be valuable for learning.


These features would differentiate us further for the student segment and also encourage daily learning habits.


News Alerts & Personalization:


Breaking News Alerts: Implement push notifications or email alerts for major breaking news or for topics a user follows. For example, a user could subscribe to “Economic News” or “Local (their district) news” and get a mobile push when a big story summary is available. This requires real-time pipeline and a mobile app or web push setup, so it’s later.


Personalized Feeds: Allow users to create accounts and select interests (e.g. technology, sports, local politics). The system could then filter or prioritize the feed based on those. With our cluster tagging and vector similarity, we can tailor what each user sees. However, we must be cautious of filter bubbles – maybe we implement personalization by topic but still show multiple perspectives within those topics, to keep the spirit of neutrality (like Particle’s approachnewsroomrobots.com).


Language Preferences per User: We already allow switching, but an account could save a default language, etc.


Mobile App & Offline Reading: Many users might prefer a native mobile app for convenience.


An app could allow offline caching of summaries (for reading on commutes without data).


It could also integrate notifications more seamlessly.


We could also design it for low data usage, which is relevant for some local users with limited connectivity.


For MVP we stick to web, but long-term an app on Android/iOS would be on the roadmap.


Expanding Coverage:


Currently we focus on Sri Lanka-related news. In the future, if successful, we could expand to other countries or regions using the same model (especially those with multilingual populations or media bias issues). We’d have to incorporate new source lists and ensure local language support for those regions.


Even within SL, we might expand to more hyper-local news or niche topics (business news, entertainment) as separate sections.


Also possibly include international news about Sri Lanka from foreign outlets to see how they cover it vs local outlets (and summarizing together could be interesting to highlight differences, though that touches on bias monitoring).


Community & Interaction:


Introduce features for users to contribute or interact. For example, a “Report discrepancy” button if someone notices the summary might be missing something or a source reports differently. This could feed back into improving content.


Perhaps allow comments or discussion per story, albeit moderated to keep things factual. This turns it slightly into a community news hub.


We could also incorporate a system where users can submit a link if they find a story not covered (crowd-sourcing inputs, though verifying those automatically is a challenge).


Gamification for student users: e.g. streaks for reading daily, or badges for completing quizzes, etc., to increase engagement.


Advanced AI Features:


Bias Meter: Following Particle’s ideanewsroomrobots.com, we could analyze the language of sources to present a bias range for the story (like “media coverage ranges from left-leaning to center on this topic”). This would require maintaining a database of source biases or using an AI to classify each source’s framing.


Source Reliability Score: Possibly show if a story had mostly “highly trusted” sources vs “mixed”. Could use external assessments of media or even incorporate user feedback on sources.


Audio Summaries: Use text-to-speech to generate a brief news podcast from the summaries each day. This would appeal to users who want to listen on the go. With AI voices improving, we could generate a daily 5-minute bulletin in three languages automatically.


Multi-modal News: Eventually, include images or videos from sources. For example, if a story cluster has a relevant photo (like an agency photo or a tweet with image), we could show a couple of pictures alongside the summary. This adds appeal but requires handling image copyrights and selection carefully. Not an MVP focus but on the horizon once core is stable.


APIs and Partnerships:


Provide an API where other apps (say a messaging app or a digital signage app at a school) can fetch the latest summary feed. This extends our reach. We would likely require an API key and could monetize this if usage grows.


Partner with radio or TV (who might use our summaries as news briefs), or telecom providers (maybe they could push our summaries via SMS for a service). A lighter version of content for SMS is possible since summaries are short.


Educational partnerships: e.g. collaborate with schools to incorporate daily news summaries in classes (tying into student features above).


Long-term Vision:


We foresee an evolution where our platform becomes a trusted daily brief for a significant portion of Sri Lankans and diaspora, akin to a modern “newspaper” but one that synthesizes all media. In the long run, we could influence raising standards in media by highlighting factual consistency and calling out discrepancies.


The idea of a “facts layer API”newsroomrobots.com is intriguing: we might essentially maintain a knowledge base of verified facts on ongoing stories (like a structured database of events, figures, quotes). This could power not just our summaries but other fact-checking or reference services. If we pursue that, we’d be moving into the domain of, say, providing a resource for journalists or researchers to quickly get the factual timeline of an event from multiple sources.


Geographical expansion: replicating the model in countries with similar needs (maybe India’s state-level news in multiple languages, etc.) or even globally if we find a niche like “trusted multi-source news without spin”.


All these future directions depend on successfully proving the concept and building user trust with the MVP. Our philosophy is to start focused (Sri Lanka news, core features) and then iterate based on user needs and market opportunities. The extensions listed ensure we have a compelling roadmap to sustain growth and engagement after the MVP stage. Each new feature would be carefully integrated in line with our principles: clarity, neutrality, and user trust should remain at the core as we expand functionality

