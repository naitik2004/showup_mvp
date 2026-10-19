import { SPORTS, Sport } from "@/types";
export default function ProfileSportsSection({ sports }: { sports: Sport[] }) {
  return (
    <section className="card">
      <h3>Favourite sports</h3>
      <div className="chips">
        {sports.length ? (
          SPORTS.filter((sport) => sports.includes(sport.id)).map((sport) => (
            <span className="chip on" key={sport.id}>
              {sport.emoji} {sport.name}
            </span>
          ))
        ) : (
          <p className="sy">No favourite sports selected yet.</p>
        )}
      </div>
    </section>
  );
}
