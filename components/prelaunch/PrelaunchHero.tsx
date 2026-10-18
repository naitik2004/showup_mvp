import BallIcon from './BallIcon';
import SampleGamesBoard from './SampleGamesBoard';

export default function PrelaunchHero() {
  return (
    <header className="hero">
      <div className="container">
        <div className="sectionLabel mono"><span>ShowUp / Local sports, organised</span><span>Private beta</span></div>
        <h1 aria-label="Show up.">
          <span className="headlineLine"><span>Show</span></span>{' '}
          <span className="headlineLine"><span>up<BallIcon className="heroBall" /></span></span>
        </h1>
        <div className="heroCopy">
          <div className="serif">Find players. Join matches. Build your sports network.</div>
          <div>
            <p>Every game near you, who’s in, and how many spots are left, on one live board. No more twenty-message group chats.</p>
            <div className="heroActions"><a className="button" href="#join">Join the waitlist</a><a className="button ghost" href="#pass">See your match pass</a></div>
          </div>
        </div>
        <SampleGamesBoard />
        <p className="note">Sample games show how the board works. Tap “Join” to explore the app.</p>
      </div>
    </header>
  );
}
