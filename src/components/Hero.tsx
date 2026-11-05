import { content } from "../content";
import { PlayButton } from "./PlayButton";
import { TitleMark } from "./TitleMark";
import { TopBar } from "./TopBar";

type Props = {
  introDone: boolean;
  paused: boolean;
  showPlay: boolean;
  onTogglePlay: () => void;
};

export function Hero({ introDone, paused, showPlay, onTogglePlay }: Props) {
  const { person, hero } = content;

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <TopBar />

      <div className="hero__content">
        <h1
          className={`hero-title ${introDone ? "is-ready" : "is-waiting"}`}
          id="hero-title"
          aria-label={`${person.firstName} ${person.lastName}`}
        >
          <TitleMark />
        </h1>

        <div className="hairline hero__hairline" data-ball-platform aria-hidden="true" />

        <div className="hero__bottom">
          <div className="hero__copy mono">
            <p>{hero.roleLine}</p>
            <p>{hero.tagline}</p>
          </div>

          <span className="open-pill mono">
            <span className="open-pill__dot" aria-hidden="true" />
            {hero.openToWork}
          </span>
        </div>
      </div>

      {showPlay ? (
        <PlayButton
          visible={introDone}
          paused={paused}
          onToggle={onTogglePlay}
        />
      ) : null}
    </section>
  );
}
