## **1\. How You Actually Used AI While Building**

**Which vibe coding tools you used:**

I used Google AI Studio exclusively as my development environment. Beyond just code generation, I leveraged the built-in AI chatbot as a feasibility consultant. I had conversations with it to test my original PRD and figure out which features were actually possible within AI Studio's constraints. This back-and-forth helped me pivot early, like when I had to remove live calendar integration, rather than discovering limitations after wasting a bunch of development time.

**What kinds of tasks you relied on AI for:**

AI handled virtually all code generation and debugging. Since I had minimal HTML/CSS/JavaScript experience coming into this project, AI Studio was indispensable for translating my product vision into functional code. When bugs appeared, Google AI Studio was able to check for them automatically.. This cycle repeated until functionality was stable. However, every design decision was made by me. 

**Where human editing, judgment, or rewriting was most important:**

The critical human layer was usability testing and functional validation. AI could generate code that technically worked, but I had to verify that it actually solved the user problem I identified. For example, ensuring the task scheduling algorithm respected user preferences, that the interface truly minimized cognitive load for ADHD users, and that the "Mark Complete" flow felt rewarding rather than clinical. These required human judgment about whether the implementation matched the intent. I also made all decisions about what to cut or simplify when AI Studio's limitations forced trade-offs.

## **2\. Why the AI Feature in Your Product Looks the Way It Does**

**Why you chose this AI feature and not others:**

The chatbot exists to solve one specific pain point of schedule adjustment. Adjustments like  "I'm sick today and need to move everything to next week" or "This assignment is taking longer than expected, rebalance my next three days." A conversational interface allows users to describe their problem in natural language rather than clicking through multiple menus. The AI can interpret intent like "shift everything today to tomorrow" and execute those operations that would require dozens of manual interactions. This transforms rescheduling from a cognitively taxing task into a simple conversation.

**What you simplified or scoped down for practicality:**

The main cut was live calendar integration. My original vision included two-way sync with Google Calendar: reading existing commitments and writing scheduled tasks back so users could see everything in their native calendar app. This proved impossible within Google AI Studio's current capabilities. While this means the app doesn't automatically stay in sync with external calendar changes, you are able to manually input recurring classes and one-off events, and it still achieves the core value proposition: identifying free blocks and auto-scheduling work sessions. It's a compromise, but one that keeps the product functional rather than waiting for technical capabilities that don't exist yet.

**How it connects to your core value proposition:**

My core promise is cognitive offloading through speed and simplicity. Students shouldn't spend mental energy deciding when to work. The AI chatbot directly serves this by making schedule adjustments effortless. When a user says "I missed my morning session, what do I do?", the AI immediately proposes a specific alternative time slot. The conversational interface maintains the frictionless experience even when plans inevitably change, which is essential for users whose executive dysfunction makes replanning especially draining.

## **3\. Risks, Trade-offs, and Integrity**

**Privacy, data use, and security:**

The original design required calendar read/write permissions, which represents significant access to sensitive personal data like class schedules, appointment details, and location information. While I ultimately had to cut live integration, the privacy concern remains even with the current implementation. The AI chatbot can read all task data and calendar information users input. In a production version, users would need explicit, prominent disclosure about what data the AI accesses and how it's used. I'd implement this through a clear permissions screen on first use and an always-visible indicator when AI has access to calendar data, similar to how video conferencing apps show when your camera is active.

**Bias and fairness:**

The AI's role is narrowly scoped to schedule optimization logic, which reduces bias risk compared to more subjective AI applications. It's primarily doing math: finding time slots, respecting constraints, avoiding conflicts. However, there could be subtle fairness issues in how it allocates work sessions. For example, does it default to scheduling morning blocks and disadvantage night owls? Does it assume consistent energy levels throughout the day? I tried to mitigate this by allowing users to set preferences and energy-level tags like "Deep Work" versus "Light Study", but there's still potential for the AI to make assumptions that don't fit all users' rhythms.

**Over-reliance on AI/user trust:**

There's a risk of automation complacency. For instance, breaking a 3-hour task into three separate 1-hour blocks spread across different days, when doing it in one session, would be more efficient. If users blindly trust the AI without reviewing its suggestions, they might end up with a fragmented schedule that increases context-switching overhead. This is why the interface shows all scheduled blocks visually. Users should be able to quickly scan and catch scheduling decisions that don't match their real-world needs. But the tension remains: users can choose this tool specifically because they don't want to think about scheduling, yet they still need to maintain some oversight.

**Academic integrity and honest use of AI:**

All conceptual work was human-generated. The product vision, PRD content, and feature prioritization all came from me. But all technical implementation was AI-generated. I came into this project with no HTML knowledge, so Google AI Studio was essential. I see this as an honest division of labor: I provided the "what and why" with product strategy, UX decisions, and user needs, while AI handled the "how" with code structure, syntax, and implementation. I don't claim to have learned full-stack development through this process, but I did learn how to effectively partner with AI to build something functional, which feels like a valuable and honest skill in itself.

**Explicit choices to limit what AI does:**

I intentionally kept the AI out of the task decomposition decision. While the AI could theoretically break a "5-hour essay" into optimally sized work sessions based on cognitive science research, I let users control this. 

**4\. What You Learned About Building with GenAI**

**Biggest surprise or challenge:**

Honestly, the biggest surprise was how iterative and unglamorous the process was. I expected moments of AI brilliance or catastrophic failure, but mostly it was just grinding through bugs. I'd describe a problem, AI would generate a fix, I'd test it, find another issue, repeat. The challenge wasn't getting AI to understand what I wanted; that was surprisingly easy with clear descriptions. The challenge was maintaining my own clarity about what "working" actually meant so I could effectively evaluate each iteration.

**One thing you'd teach another founder:**

Simple AI integration can be a disproportionate value-add. You don't need to build a groundbreaking ML model to meaningfully improve user experience. My chatbot does something relatively straightforward: it parses natural language requests and executes scheduling logic. But it transforms a painful multi-step workflow into a single conversation. For founders, especially non-technical ones, the lesson is: identify where your users experience friction or cognitive load, then explore if a conversational AI interface could eliminate steps rather than just add intelligence. Sometimes "smart" matters less than "effortless."

**How this affects your thinking on future ventures:**

This project fundamentally changed my relationship with the MVP concept. I previously saw MVPs as necessarily crude or limited, but using AI Studio showed me you can build something with apparent sophistication and polish very quickly. If I can articulate what I want through a detailed PRD, clear user stories, and specific interaction patterns, AI can implement it rapidly. This means in future ventures, I'll spend more time upfront on product strategy and user research, knowing that the translation to code is no longer the bottleneck it once was. The hard part isn't building anymore. It's knowing what to build and why it matters.

