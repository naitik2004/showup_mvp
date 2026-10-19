import { PlayerReview } from '../types';

export default function PlayerReviews({ reviews, error }: { reviews: PlayerReview[]; error: string }) {
  return (
    <section className="card">
      <h3>Reviews</h3>
      {error ? <p role="alert">{error}</p> : reviews.length ? reviews.map((review) => (
        <div className="mem" key={review.id}>
          <div>
            <b>{review.name}</b>
            <p className="mono">{review.player_id}</p>
            <small>
              {review.sport.replaceAll('_', ' ')} · Skill {review.skill_score}/5 ·
              Sportsmanship {review.sportsmanship_score}/5 · Reliability {review.reliability_score}/5
            </small>
          </div>
        </div>
      )) : <p>No reviews yet.</p>}
    </section>
  );
}
