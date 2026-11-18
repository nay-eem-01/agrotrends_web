import { CheckCircle, SealCheck, Sparkle } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../../lib/i18n'
import { ButtonLink } from '../../ui/Button'
import { MailLink } from './SitePage'

/** The marks the product itself puts on answers, so the page shows them as a reader will meet them. */
type Mark = 'open' | 'unchecked' | 'confirmed' | 'accepted'

interface Copy {
  title: string
  lead: string
  actions: { questions: string }
  why: { head: string; statement: string; body: ReactNode[] }
  checked: { head: string; steps: { title: string; text: string; mark?: Mark }[]; marks: Record<Mark, string> }
  can: { head: string; items: { title: string; text: string; link: string }[] }
  experts: { head: string; text: string; link: string }
  team: { head: string; text: string }
  next: { head: string; items: string[] }
  talk: { head: string; before: string; after: string }
}

const COPY: Record<'en' | 'bn', Copy> = {
  en: {
    title: 'About us',
    lead: 'AgroTrends is where farming knowledge from Bangladesh gets written down, asked about and shared.',
    actions: { questions: 'See questions' },
    why: {
      head: 'Why we started',
      statement: 'Good farming advice is everywhere and nowhere.',
      body: [
        "It lives in a neighbour’s twenty seasons with boro rice, in an extension officer’s visit, in a researcher’s paper that never reaches the field. When a crop starts yellowing or a pond goes quiet at dawn, the answer usually exists. It just isn’t written down where a farmer can find it.",
        'AgroTrends is our attempt to fix that: a place where farmers, agronomists and students write what they know, in Bangla or English, and anyone can read it, ask about it and build on it.',
      ],
    },
    checked: {
      head: 'How an answer gets checked',
      steps: [
        { title: 'You ask in public', text: 'A question about your crop, pest, soil or pond. Anyone can read it and answer.', mark: 'open' },
        { title: 'The AI answers first', text: 'In seconds, from the stories on AgroTrends, with its sources. Until an expert looks, it says so.', mark: 'unchecked' },
        { title: 'An expert checks it', text: 'A verified expert in that topic confirms or corrects the AI answer, under their own name.', mark: 'confirmed' },
        { title: 'People answer, you choose', text: 'Members and experts add what they know. You accept the answer that helped.', mark: 'accepted' },
      ],
      marks: { open: 'Unanswered', unchecked: 'Not yet checked by an expert', confirmed: 'Confirmed by a verified expert', accepted: 'Accepted' },
    },
    can: {
      head: 'What you can do here',
      items: [
        { title: 'Read stories', text: 'Practical write-ups from people who grow, research and teach: what worked, what didn’t, and why.', link: 'Browse stories' },
        { title: 'Ask the community', text: 'Post a question about a crop, pest, soil or pond and get answers from other members and verified experts.', link: 'See questions' },
        { title: 'Ask the AI advisor', text: 'It answers from the stories on AgroTrends and shows which ones it drew on, so you can read the source and judge for yourself.', link: 'Open the advisor' },
        { title: 'Write', text: 'Anyone with an account can publish. What you write can help someone three districts away.', link: 'Write a story' },
      ],
    },
    experts: {
      head: 'Verified experts',
      text: 'Farmers trust an answer more when they know who gave it. Agronomists, researchers, extension officers and experienced growers can apply for a verified-expert badge in their topics. Our team checks each application and its proof by hand before a badge appears.',
      link: 'Become a verified expert',
    },
    team: {
      head: 'Who we are',
      text: 'AgroTrends is built and run by a team of three. We are an independent project, not yet a registered company, and we build in the open: what we change and why is written down as we go.',
    },
    next: {
      head: 'What’s next',
      items: ['Bengali everywhere, including the messages the server sends.', 'AI answers that number their sources, with follow-up questions.', 'Following whole topics, so your home shows what you grow.'],
    },
    talk: { head: 'Talk to us', before: 'Questions, ideas, a story you’d like to see, or something that’s wrong: write to', after: 'We read every message.' },
  },
  bn: {
    title: 'আমাদের কথা',
    lead: 'AgroTrends হলো সেই জায়গা, যেখানে বাংলাদেশের চাষের জ্ঞান লেখা হয়, তা নিয়ে প্রশ্ন হয়, আর সবার সাথে ভাগ করা হয়।',
    actions: { questions: 'প্রশ্নগুলো দেখুন' },
    why: {
      head: 'কেন শুরু করলাম',
      statement: 'ভালো চাষের পরামর্শ সবখানে আছে, আবার কোথাও নেই।',
      body: [
        'তা থাকে প্রতিবেশীর বিশ বছরের বোরো চাষের অভিজ্ঞতায়, কৃষি কর্মকর্তার এক দিনের পরিদর্শনে, কিংবা গবেষকের এমন প্রবন্ধে যা কখনো মাঠে পৌঁছায় না। ধানের পাতা হলুদ হতে শুরু করলে বা ভোরে পুকুরের মাছ ভেসে উঠলে উত্তরটা সাধারণত কারো জানা থাকে, শুধু কৃষকের হাতের কাছে লেখা থাকে না।',
        'AgroTrends সেই ফাঁকটা পূরণের চেষ্টা: এখানে কৃষক, কৃষিবিদ আর শিক্ষার্থীরা বাংলা বা ইংরেজিতে নিজের জানা কথা লেখেন, আর যে কেউ তা পড়তে, প্রশ্ন করতে আর তার ওপর ভিত্তি করে এগোতে পারেন।',
      ],
    },
    checked: {
      head: 'একটি উত্তর কীভাবে যাচাই হয়',
      steps: [
        { title: 'প্রকাশ্যে প্রশ্ন করুন', text: 'আপনার ফসল, পোকা, মাটি বা পুকুর নিয়ে প্রশ্ন। যে কেউ পড়তে ও উত্তর দিতে পারেন।', mark: 'open' },
        { title: 'আগে উত্তর দেয় এআই', text: 'কয়েক সেকেন্ডে, AgroTrends-এর লেখা থেকে, সূত্রসহ। বিশেষজ্ঞ না দেখা পর্যন্ত তা লেখা থাকে।', mark: 'unchecked' },
        { title: 'বিশেষজ্ঞ যাচাই করেন', text: 'ওই বিষয়ের একজন যাচাই করা বিশেষজ্ঞ নিজের নামে এআই উত্তরটি নিশ্চিত বা সংশোধন করেন।', mark: 'confirmed' },
        { title: 'মানুষ উত্তর দেন, আপনি বেছে নেন', text: 'সদস্য আর বিশেষজ্ঞরা নিজের জানা কথা লেখেন। যে উত্তর কাজে লাগল, সেটি আপনি গ্রহণ করেন।', mark: 'accepted' },
      ],
      marks: { open: 'উত্তর নেই', unchecked: 'বিশেষজ্ঞ এখনো যাচাই করেননি', confirmed: 'যাচাই করা বিশেষজ্ঞ নিশ্চিত করেছেন', accepted: 'গৃহীত' },
    },
    can: {
      head: 'এখানে যা করতে পারেন',
      items: [
        { title: 'লেখা পড়ুন', text: 'যাঁরা চাষ করেন, গবেষণা করেন আর পড়ান, তাঁদের হাতে-কলমে লেখা: কী কাজ করেছে, কী করেনি, আর কেন।', link: 'লেখাগুলো দেখুন' },
        { title: 'কমিউনিটিকে জিজ্ঞেস করুন', text: 'ফসল, পোকা, মাটি বা পুকুর নিয়ে প্রশ্ন করুন, উত্তর দেবেন অন্য সদস্য আর যাচাই করা বিশেষজ্ঞরা।', link: 'প্রশ্নগুলো দেখুন' },
        { title: 'এআই পরামর্শককে জিজ্ঞেস করুন', text: 'এটি AgroTrends-এর লেখা থেকে উত্তর দেয় এবং কোন লেখা থেকে নিয়েছে তা দেখায়, যাতে আপনি নিজে মূল লেখা পড়ে বিচার করতে পারেন।', link: 'পরামর্শক খুলুন' },
        { title: 'লিখুন', text: 'অ্যাকাউন্ট থাকলেই যে কেউ লিখতে পারেন। আপনার লেখা হয়তো তিন জেলা দূরের কারো কাজে লাগবে।', link: 'একটি লেখা লিখুন' },
      ],
    },
    experts: {
      head: 'যাচাই করা বিশেষজ্ঞ',
      text: 'কে উত্তর দিয়েছেন জানলে কৃষক সেই উত্তরে বেশি ভরসা করেন। কৃষিবিদ, গবেষক, কৃষি কর্মকর্তা আর অভিজ্ঞ চাষিরা নিজের বিষয়ে যাচাই করা বিশেষজ্ঞের ব্যাজের জন্য আবেদন করতে পারেন। ব্যাজ দেওয়ার আগে আমাদের দল প্রতিটি আবেদন আর তার প্রমাণ নিজে দেখে।',
      link: 'যাচাই করা বিশেষজ্ঞ হোন',
    },
    team: {
      head: 'আমরা কারা',
      text: 'AgroTrends তৈরি ও পরিচালনা করে তিনজনের একটি দল। আমরা একটি স্বাধীন উদ্যোগ, এখনো নিবন্ধিত প্রতিষ্ঠান নই। কী বদলাচ্ছি আর কেন, তা আমরা কাজের সাথে সাথে লিখে রাখি।',
    },
    next: {
      head: 'সামনে যা আসছে',
      items: ['সবখানে বাংলা, সার্ভারের বার্তাসহ।', 'এআই উত্তরে সূত্রের নম্বর আর পরের প্রশ্নের প্রস্তাব।', 'পুরো বিষয় অনুসরণ, যাতে আপনার হোমে আপনার ফসলের কথাই আসে।'],
    },
    talk: { head: 'আমাদের লিখুন', before: 'প্রশ্ন, পরামর্শ, কোনো লেখার অনুরোধ, বা কিছু ভুল চোখে পড়লে এই ঠিকানায় লিখুন:', after: 'আমরা প্রতিটি বার্তা পড়ি।' },
  },
}

const head = 'font-serif text-[1.75rem] leading-tight font-medium tracking-[-0.015em] text-balance [overflow-wrap:break-word] sm:text-[2.5rem]'
const rowLink = 'mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline'
const prose = 'max-w-[58ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg'

/**
 * Who we are and why AgroTrends exists, for someone deciding whether to trust it: the reason, then how an answer gets
 * checked (shown with the marks the product puts on answers), what you can do, the experts and the team, and how to
 * reach us. Both languages share the composition; only the words differ.
 */
export function AboutPage() {
  const copy = COPY[useLang() === 'bn' ? 'bn' : 'en']
  return (
    <article className="mx-auto flex max-w-(--container-page) flex-col gap-20 px-4 pt-10 pb-20 sm:px-8 sm:pt-14 lg:gap-28 lg:pt-16">
      <title>{`${copy.title} – AgroTrends`}</title>
      <header className="max-w-3xl">
        <h1 className="font-serif text-[2.25rem] leading-[1.08] font-medium tracking-[-0.02em] text-balance [overflow-wrap:break-word] sm:text-[3.25rem]">{copy.title}</h1>
        <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-pretty text-muted-foreground sm:text-[1.375rem]">{copy.lead}</p>
        <div className="mt-7">
          <ButtonLink to="/questions" className="w-full sm:w-auto">
            {copy.actions.questions}
          </ButtonLink>
        </div>
      </header>

      <section aria-labelledby="about-checked">
        <h2 id="about-checked" className={head}>
          {copy.checked.head}
        </h2>
        {/* The process the product runs, as a real ordered list: four steps across from 1024px, two from 640px. */}
        <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {copy.checked.steps.map((step, index) => (
            <li key={step.title} className="flex flex-col border-t border-border-strong pt-5">
              <span aria-hidden="true" className="font-serif text-[1.375rem] leading-none font-medium text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              {step.mark && (
                <div className="mt-4">
                  <AnswerMark mark={step.mark} label={copy.checked.marks[step.mark]} />
                </div>
              )}
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-pretty text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="about-why" className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <h2 id="about-why" className={head}>
          {copy.why.head}
        </h2>
        <div className="flex flex-col gap-5">
          <p className="max-w-[34ch] font-serif text-[1.375rem] leading-[1.3] font-medium text-balance text-foreground">{copy.why.statement}</p>
          {copy.why.body.map((paragraph, index) => (
            <p key={index} className={prose}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section aria-labelledby="about-can" className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <h2 id="about-can" className={head}>
          {copy.can.head}
        </h2>
        {/* Destinations as literal links, in the order of the rows above them in COPY. */}
        <ul className="border-t border-border">
          <CanRow item={copy.can.items[0]} link={<Link to="/stories" className={rowLink}>{copy.can.items[0].link}</Link>} />
          <CanRow item={copy.can.items[1]} link={<Link to="/questions" className={rowLink}>{copy.can.items[1].link}</Link>} />
          <CanRow item={copy.can.items[2]} link={<Link to="/advisor" className={rowLink}>{copy.can.items[2].link}</Link>} />
          <CanRow item={copy.can.items[3]} link={<Link to="/write" className={rowLink}>{copy.can.items[3].link}</Link>} />
        </ul>
      </section>

      {/* Who checks the answers beside who runs the place. */}
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="about-experts" className="rounded-2xl bg-surface p-6 sm:p-9">
          <SealCheck size={32} weight="fill" aria-hidden="true" className="text-mustard-ink" />
          <h2 id="about-experts" className={`mt-4 ${head}`}>
            {copy.experts.head}
          </h2>
          <p className={`mt-4 ${prose}`}>{copy.experts.text}</p>
          <ButtonLink to="/experts/apply" className="mt-7">
            {copy.experts.link}
          </ButtonLink>
        </section>
        <section aria-labelledby="about-team" className="lg:py-9">
          <h2 id="about-team" className={head}>
            {copy.team.head}
          </h2>
          <p className={`mt-4 ${prose}`}>{copy.team.text}</p>
          <h3 className="mt-12 text-xl font-semibold">{copy.next.head}</h3>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-muted-foreground marker:text-primary">
            {copy.next.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="about-talk" className="grid items-center gap-6 border-t border-border pt-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <h2 id="about-talk" className={head}>
          {copy.talk.head}
        </h2>
        <div>
          <p className={prose}>{copy.talk.before}</p>
          <MailLink className="mt-3 inline-block font-serif text-[1.375rem] font-medium break-all text-primary underline decoration-primary/40 underline-offset-[0.2em] hover:decoration-primary sm:text-[2rem]" />
          <p className={`mt-3 ${prose}`}>{copy.talk.after}</p>
        </div>
      </section>
    </article>
  )
}

function CanRow({ item, link }: { item: Copy['can']['items'][number]; link: ReactNode }) {
  return (
    <li className="grid gap-2 border-b border-border py-6 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-8">
      <h3 className="text-lg font-semibold">{item.title}</h3>
      <div>
        <p className="max-w-[60ch] text-base leading-relaxed text-pretty text-muted-foreground">{item.text}</p>
        {link}
      </div>
    </li>
  )
}

/** The product's own marks, at the size the question page shows them. */
function AnswerMark({ mark, label }: { mark: Mark; label: string }) {
  const pill = 'inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium'
  if (mark === 'open') return <span className={`${pill} border border-dashed border-mustard text-foreground`}>{label}</span>
  if (mark === 'unchecked') {
    return (
      <span className={`${pill} bg-muted text-muted-foreground`}>
        <Sparkle size={16} weight="fill" aria-hidden="true" className="text-primary" />
        {label}
      </span>
    )
  }
  if (mark === 'confirmed') {
    return (
      <span className={`${pill} bg-mustard-soft text-foreground`}>
        <SealCheck size={16} weight="fill" aria-hidden="true" className="text-mustard-ink" />
        {label}
      </span>
    )
  }
  return (
    <span className={`${pill} bg-mustard-soft font-semibold text-mustard-ink`}>
      <CheckCircle size={16} weight="fill" aria-hidden="true" />
      {label}
    </span>
  )
}
