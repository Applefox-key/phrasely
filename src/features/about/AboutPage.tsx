import { useState } from "react";
import { Link } from "react-router-dom";

interface AboutCard {
  id: number;
  title: string;
  short: string[];
  long?: string[];
  list?: string[];
}

const aboutCards: AboutCard[] = [
  {
    id: 1,
    title: "ABOUT THE APP",
    short: ["This page <span>will help you remember</span> a new phrase or word using the 90 seconds technique."],
    long: [
      "You just need to add sentences to memorize to your list and <span>just read the phrase according to the schedule</span>.",
    ],
    list: [
      "add phrases to memorize to your list",
      "select a part of your phrase to highlight it during training",
      "add a note to have a pop-up during training",
      "add a folder to order your phrases list",
      "learn at your own pace — add phrases to the queue for gradual automatic activation",
    ],
  },
  {
    id: 2,
    title: "STRATEGY",
    short: ["Write down the phrase you saw or heard in a sentence."],
    long: [
      "This way, you'll capture useful details (prepositions, articles, word order, etc.) and, most importantly, be able to use it when needed.",
    ],
    list: [
      "When you see a new expression, <span>write it down</span> in your notes.",
      "<span>Give it some context.</span>",
      "Don't just write the translation.",
    ],
  },
  {
    id: 3,
    title: "PLAN",
    short: ["Follow a special plan"],
    long: ["You must not skip more than 3 consecutive days at any stage."],
    list: [
      "For 7 days, read each expression out loud twice a day.",
      "1 week later, read it out loud again (3 times each).",
      "2 weeks later, read it out loud again (3 times each).",
      "70 + 10 + 10 = 90 seconds. <span>It takes 10 seconds to read a phrase.</span>",
      "<span>If you exceed the allowed breaks, just start again!</span>",
    ],
  },
  {
    id: 4,
    title: "TIPS",
    short: ["<span>Read</span> an expression <span>out loud</span>, emotionally and clearly."],
    list: [
      "Don't force yourself to memorize an expression.",
      "Just <span>focus</span> on it and understand what you're saying.",
      "This helps cement the expression in your memory.",
    ],
  },
];

const shortInstructions = [
  "Add a phrase to your list",
  "Read it according to the plan",
  "Spend only 90 seconds of your time",
];

export default function AboutPage() {
  const [openId, setOpenId] = useState<number | null>(1);

  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">💬</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Learn More</h1>
        <p className="text-gray-500 dark:text-gray-400">
          about the <strong>90 seconds method</strong> — or{" "}
          <a href="https://flashcards.learnypie.com" className="text-teal-600 dark:text-teal-400 hover:underline">
            try the flashcard method
          </a>
        </p>
      </div>

      {/* Accordion cards */}
      <div className="space-y-3 mb-8">
        {aboutCards.map((card) => {
          const isOpen = openId === card.id;
          return (
            <div
              key={card.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 hover:dark:bg-slate-700 transition-colors"
                onClick={() => toggle(card.id)}>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-teal-600 dark:text-teal-400 tracking-wide mb-0.5">
                    {card.title}
                  </h2>
                  {card.short.map((s, i) => (
                    <p
                      key={i}
                      className="text-sm text-gray-600 dark:text-gray-400 [&_span]:text-teal-700 [&_span]:dark:text-teal-400 [&_span]:font-semibold"
                      dangerouslySetInnerHTML={{ __html: s }}
                    />
                  ))}
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 shrink-0 ml-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-slate-700 pt-4 space-y-3">
                  {card.long?.map((text, i) => (
                    <p
                      key={i}
                      className="text-sm text-gray-600 dark:text-gray-400 [&_span]:text-teal-700 [&_span]:dark:text-teal-400 [&_span]:font-semibold"
                      dangerouslySetInnerHTML={{ __html: text }}
                    />
                  ))}
                  {card.list && (
                    <ul className="space-y-2">
                      {card.list.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="text-teal-500 dark:text-teal-400 shrink-0 mt-0.5">▸</span>
                          <span
                            className="[&_span]:text-teal-700 [&_span]:dark:text-teal-400 [&_span]:font-semibold"
                            dangerouslySetInnerHTML={{ __html: item }}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Short instruction */}
      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg px-5 py-4 mb-8">
        <h3 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-3">
          Short instruction
        </h3>
        <ol className="space-y-2">
          {shortInstructions.map((step, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-teal-800 dark:text-teal-300">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold shrink-0">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* CTA */}
      <div className="text-center space-y-3">
        <Link
          to="/register"
          className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-medium px-8 py-2.5 rounded-md transition-colors">
          Get started for free
        </Link>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Other learnypie.com projects:{" "}
          <a href="https://flashcards.learnypie.com" className="hover:text-teal-600 hover:dark:text-teal-400 underline">
            FlashMinds
          </a>
          {" · "}
          <a href="https://tracker.learnypie.com" className="hover:text-teal-600 hover:dark:text-teal-400 underline">
            Tracker
          </a>
        </p>
      </div>
    </div>
  );
}
