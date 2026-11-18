import { Link } from 'react-router-dom'
import { useT } from '../../lib/i18n'
import { MailLink, SitePage } from './SitePage'

/** The rules for using AgroTrends. English only for now. */
export function TermsPage() {
  const t = useT()
  return (
    <SitePage title={t('Terms of use')} updated englishOnly>
      <p>
        These terms are the agreement between you and the AgroTrends team when you use AgroTrends. By creating an account
        or using the site, you accept them. Please also read our <Link to="/privacy">privacy policy</Link>.
      </p>

      <h2>Who runs AgroTrends</h2>
      <p>
        AgroTrends is run by a team of three in Bangladesh. We are an independent project and not yet a registered
        company. Contact us at <MailLink />.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give your real name or the name you are known by, and an e-mail address or mobile number you can reach.</li>
        <li>Keep your password to yourself. You are responsible for what happens under your account.</li>
        <li>One person, one account. Don't create accounts for someone else or to get around a ban.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        What you write stays yours. By publishing it on AgroTrends you give us permission to store it, show it to anyone,
        and let the AI advisor quote and link to it (you can turn this off for a story in the editor). This permission
        ends when you delete the post, except for copies others have already shared or that remain in backups for a short
        time.
      </p>
      <p>Only post what you have the right to share. Credit your sources, and don't copy other people's work or photos.</p>

      <h2>Community rules</h2>
      <p>AgroTrends works because people can trust what they read. So don't:</p>
      <ul>
        <li>Knowingly post false or dangerous advice, such as unsafe doses of pesticides or banned chemicals.</li>
        <li>Harass, threaten or insult anyone, or attack people for who they are.</li>
        <li>Post spam, advertising disguised as advice, or links to scams.</li>
        <li>Pretend to be someone else or claim qualifications you don't have.</li>
        <li>Post anything illegal in Bangladesh, or other people's private information.</li>
      </ul>
      <p>
        You can report posts that break these rules. Our team reviews reports and may hide posts, remove expert badges, or
        suspend accounts. If you think we got it wrong, write to <MailLink />.
      </p>

      <h2>Verified experts</h2>
      <p>
        A verified-expert badge means our team checked the proof you sent for the topics shown. It is not a guarantee that
        every answer is right. We may remove a badge if the proof turns out to be false or the rules are broken.
      </p>

      <h2>Advice on AgroTrends, including the AI advisor</h2>
      <p>
        Stories, answers and the AI advisor's replies are shared for general information. They are not a substitute for
        advice from an agricultural officer, veterinarian or other professional who can see your field, animals or pond.
        The AI advisor can be wrong: read the stories it links to, check any chemical against its label and local rules,
        and when in doubt ask your nearest agricultural extension office. You use any advice at your own risk.
      </p>

      <h2>The service</h2>
      <p>
        AgroTrends is free to use. We are a small team, so it is provided "as is": we work to keep it running and correct,
        but we can't promise it will always be available or free of errors, and we may change or stop features. As far as
        the law allows, we are not liable for losses that come from using AgroTrends or the advice on it.
      </p>

      <h2>Leaving</h2>
      <p>
        You can stop using AgroTrends at any time and ask us to delete your account (see the{' '}
        <Link to="/privacy">privacy policy</Link>). We may suspend or close accounts that break these terms.
      </p>

      <h2>Changes and law</h2>
      <p>
        If we change these terms we will update the date at the top, and tell members on AgroTrends about changes that
        matter before they take effect. These terms are governed by the laws of Bangladesh.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <MailLink />.
      </p>
    </SitePage>
  )
}
