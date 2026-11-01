import { Link } from 'react-router-dom'
import { useT } from '../../lib/i18n'
import { MailLink, SitePage } from './SitePage'

/** What AgroTrends collects, why, who else sees it, and how to have it removed. English only for now. */
export function PrivacyPage() {
  const t = useT()
  return (
    <SitePage title={t('Privacy policy')} updated englishOnly>
      <p>
        This policy explains what AgroTrends collects when you use it, what we do with it, and the choices you have. We
        keep it short and plain on purpose. If anything is unclear, write to <MailLink />.
      </p>

      <h2>Who we are</h2>
      <p>
        AgroTrends is run by a team of three in Bangladesh. We are an independent project and not yet a registered
        company. In this policy "we" means that team. You can reach us at <MailLink />.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Your account:</strong> your name, your e-mail address or mobile number, and your password. We store a
          one-way hash of your password, never the password itself. If you sign in with Google, Google tells us your name,
          e-mail address and profile photo.
        </li>
        <li>
          <strong>Your profile, if you fill it in:</strong> photo, cover photo, bio, designation, occupation, workplace,
          location and specialities.
        </li>
        <li>
          <strong>What you post and do:</strong> stories, questions, answers and comments; votes, reactions, saved stories,
          the people and tags you follow, and reports you send.
        </li>
        <li>
          <strong>Expert applications:</strong> the field, institution and proof you send when you apply for a
          verified-expert badge.
        </li>
        <li>
          <strong>Questions to the AI advisor</strong> and the answers it gives you, so you can find them again in your
          history.
        </li>
        <li>
          <strong>Images you upload</strong> to stories, questions and your profile.
        </li>
        <li>
          <strong>Basic technical records:</strong> like any website, our server may log the time of a request, your IP
          address and your browser, to keep the service running and to stop abuse.
        </li>
      </ul>

      <h2>On your device</h2>
      <p>
        AgroTrends keeps a few things in your browser's storage: the token that keeps you signed in, your language and
        theme, whether the sidebar is open, and unsaved story drafts. We don't use advertising or analytics trackers, and
        we don't use cookies to follow you around the web.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account: sign you in, show your posts, and send you notifications.</li>
        <li>To send e-mails and text messages you need: confirming your address or number, and resetting your password.</li>
        <li>To answer your questions with the AI advisor, using stories published on AgroTrends.</li>
        <li>To review expert applications and reports, and to keep the community safe from spam and abuse.</li>
      </ul>
      <p>We don't sell your information, and we don't show ads.</p>

      <h2>What is public</h2>
      <p>
        Your name, profile and everything you publish (stories, questions, answers and comments) can be seen by anyone,
        including people who aren't signed in, and may appear in search engines. Your e-mail address, mobile number and
        password are never shown to other members. Drafts stay private until you publish them.
      </p>

      <h2>Who else handles it</h2>
      <p>We use a few outside services to run AgroTrends. They receive only what they need for their part:</p>
      <ul>
        <li>
          <strong>Google:</strong> Google sign-in, if you choose it; and Google's Gemini models, which read your question
          to the AI advisor and the text of published stories to find and write an answer.
        </li>
        <li>
          <strong>E-mail and SMS providers:</strong> to deliver confirmation codes and password-reset links.
        </li>
        <li>
          <strong>Our hosting provider:</strong> the servers and storage AgroTrends runs on.
        </li>
      </ul>
      <p>We will share information with authorities only when the law requires it.</p>

      <h2>The AI advisor and your stories</h2>
      <p>
        The AI advisor answers from stories published on AgroTrends and links to the ones it used. If you write a story
        and don't want the advisor to use it, turn off "Let the AI advisor cite this story" in the editor.
      </p>

      <h2>Keeping and deleting your information</h2>
      <p>
        We keep your information while your account exists. You can change your profile at any time in{' '}
        <Link to="/settings">Settings</Link>, and delete your own stories, questions and answers. To delete your account,
        write to <MailLink /> from the address on your account (or tell us your mobile number) and we will delete it. Say
        if you also want your published posts removed.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are stored as hashes, and only our team can reach the servers. No system is perfectly safe, so use a
        password you don't use anywhere else. If you think someone else has used your account, change your password and
        write to us.
      </p>

      <h2>Children</h2>
      <p>AgroTrends is meant for people aged 13 and over. Students younger than that should use it with a parent or teacher.</p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy, we will update the date at the top. For changes that matter, we will also tell members on
        AgroTrends before they take effect.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your information: <MailLink />.
      </p>
    </SitePage>
  )
}
