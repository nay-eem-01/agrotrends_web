import { Link } from 'react-router-dom'
import { useLang, useT } from '../../lib/i18n'
import { MailLink, SitePage } from './SitePage'

/** Who we are and why AgroTrends exists. Written in both languages; the team will revise it. */
export function AboutPage() {
  const t = useT()
  const lang = useLang()
  return (
    <SitePage title={t('About us')} lead={t('AgroTrends is where farming knowledge from Bangladesh gets written down, asked about and shared.')}>
      {lang === 'bn' ? <Bengali /> : <English />}
    </SitePage>
  )
}

function English() {
  return (
    <>
      <h2>Why we started</h2>
      <p>
        Good farming advice is everywhere and nowhere. It lives in a neighbour's twenty seasons with boro rice, in an
        extension officer's visit, in a researcher's paper that never reaches the field. When a crop starts yellowing or a
        pond goes quiet at dawn, the answer usually exists. It just isn't written down where a farmer can find it.
      </p>
      <p>
        AgroTrends is our attempt to fix that: a place where farmers, agronomists and students write what they know, in
        Bangla or English, and anyone can read it, ask about it and build on it.
      </p>

      <h2>What you can do here</h2>
      <ul>
        <li>
          <strong>Read stories.</strong> Practical write-ups from people who grow, research and teach: what worked, what
          didn't, and why. <Link to="/stories">Browse stories</Link>.
        </li>
        <li>
          <strong>Ask the community.</strong> Post a question about a crop, pest, soil or pond and get answers from other
          members and verified experts. <Link to="/questions">See questions</Link>.
        </li>
        <li>
          <strong>Ask the AI advisor.</strong> It answers from the stories on AgroTrends and shows which ones it drew on,
          so you can read the source and judge for yourself. <Link to="/advisor">Open the advisor</Link>.
        </li>
        <li>
          <strong>Write.</strong> Anyone with an account can publish. What you write can help someone three districts
          away. <Link to="/write">Write a story</Link>.
        </li>
      </ul>

      <h2>Verified experts</h2>
      <p>
        Farmers trust an answer more when they know who gave it. Agronomists, researchers, extension officers and
        experienced growers can apply for a verified-expert badge in their topics. Our team checks each application and
        its proof by hand before a badge appears. <Link to="/experts/apply">Become a verified expert</Link>.
      </p>

      <h2>Who we are</h2>
      <p>
        AgroTrends is built and run by a team of three. We are an independent project, not yet a registered company, and
        we build in the open: what we change and why is written down as we go.
      </p>

      <h2>What's next</h2>
      <ul>
        <li>Bengali everywhere, including the messages the server sends.</li>
        <li>AI answers that number their sources, with follow-up questions.</li>
        <li>Following whole topics, so your home shows what you grow.</li>
      </ul>

      <h2>Talk to us</h2>
      <p>
        Questions, ideas, a story you'd like to see, or something that's wrong: write to <MailLink />. We read every
        message.
      </p>
    </>
  )
}

function Bengali() {
  return (
    <>
      <h2>কেন শুরু করলাম</h2>
      <p>
        ভালো চাষের পরামর্শ সবখানে আছে, আবার কোথাও নেই। তা থাকে প্রতিবেশীর বিশ বছরের বোরো চাষের অভিজ্ঞতায়, কৃষি
        কর্মকর্তার এক দিনের পরিদর্শনে, কিংবা গবেষকের এমন প্রবন্ধে যা কখনো মাঠে পৌঁছায় না। ধানের পাতা হলুদ হতে শুরু করলে
        বা ভোরে পুকুরের মাছ ভেসে উঠলে উত্তরটা সাধারণত কারো জানা থাকে, শুধু কৃষকের হাতের কাছে লেখা থাকে না।
      </p>
      <p>
        AgroTrends সেই ফাঁকটা পূরণের চেষ্টা: এখানে কৃষক, কৃষিবিদ আর শিক্ষার্থীরা বাংলা বা ইংরেজিতে নিজের জানা কথা লেখেন,
        আর যে কেউ তা পড়তে, প্রশ্ন করতে আর তার ওপর ভিত্তি করে এগোতে পারেন।
      </p>

      <h2>এখানে যা করতে পারেন</h2>
      <ul>
        <li>
          <strong>লেখা পড়ুন।</strong> যাঁরা চাষ করেন, গবেষণা করেন আর পড়ান, তাঁদের হাতে-কলমে লেখা: কী কাজ করেছে, কী
          করেনি, আর কেন। <Link to="/stories">লেখাগুলো দেখুন</Link>।
        </li>
        <li>
          <strong>কমিউনিটিকে জিজ্ঞেস করুন।</strong> ফসল, পোকা, মাটি বা পুকুর নিয়ে প্রশ্ন করুন, উত্তর দেবেন অন্য সদস্য আর
          যাচাই করা বিশেষজ্ঞরা। <Link to="/questions">প্রশ্নগুলো দেখুন</Link>।
        </li>
        <li>
          <strong>এআই পরামর্শককে জিজ্ঞেস করুন।</strong> এটি AgroTrends-এর লেখা থেকে উত্তর দেয় এবং কোন লেখা থেকে নিয়েছে
          তা দেখায়, যাতে আপনি নিজে মূল লেখা পড়ে বিচার করতে পারেন। <Link to="/advisor">পরামর্শক খুলুন</Link>।
        </li>
        <li>
          <strong>লিখুন।</strong> অ্যাকাউন্ট থাকলেই যে কেউ লিখতে পারেন। আপনার লেখা হয়তো তিন জেলা দূরের কারো কাজে লাগবে।{' '}
          <Link to="/write">একটি লেখা লিখুন</Link>।
        </li>
      </ul>

      <h2>যাচাই করা বিশেষজ্ঞ</h2>
      <p>
        কে উত্তর দিয়েছেন জানলে কৃষক সেই উত্তরে বেশি ভরসা করেন। কৃষিবিদ, গবেষক, কৃষি কর্মকর্তা আর অভিজ্ঞ চাষিরা নিজের
        বিষয়ে যাচাই করা বিশেষজ্ঞের ব্যাজের জন্য আবেদন করতে পারেন। ব্যাজ দেওয়ার আগে আমাদের দল প্রতিটি আবেদন আর তার
        প্রমাণ নিজে দেখে। <Link to="/experts/apply">যাচাই করা বিশেষজ্ঞ হোন</Link>।
      </p>

      <h2>আমরা কারা</h2>
      <p>
        AgroTrends তৈরি ও পরিচালনা করে তিনজনের একটি দল। আমরা একটি স্বাধীন উদ্যোগ, এখনো নিবন্ধিত প্রতিষ্ঠান নই। কী বদলাচ্ছি
        আর কেন, তা আমরা কাজের সাথে সাথে লিখে রাখি।
      </p>

      <h2>সামনে যা আসছে</h2>
      <ul>
        <li>সবখানে বাংলা, সার্ভারের বার্তাসহ।</li>
        <li>এআই উত্তরে সূত্রের নম্বর আর পরের প্রশ্নের প্রস্তাব।</li>
        <li>পুরো বিষয় অনুসরণ, যাতে আপনার হোমে আপনার ফসলের কথাই আসে।</li>
      </ul>

      <h2>আমাদের লিখুন</h2>
      <p>
        প্রশ্ন, পরামর্শ, কোনো লেখার অনুরোধ, বা কিছু ভুল চোখে পড়লে লিখুন <MailLink /> ঠিকানায়। আমরা প্রতিটি বার্তা পড়ি।
      </p>
    </>
  )
}
