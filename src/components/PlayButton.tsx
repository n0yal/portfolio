import { content } from "../content";

type Props = {
  visible: boolean;
  paused: boolean;
  onToggle: () => void;
};

export function PlayButton({ visible, paused, onToggle }: Props) {
  return (
    <button
      type="button"
      className={`play-button ${visible ? "is-visible" : ""} ${
        paused ? "is-paused" : ""
      }`}
      onClick={onToggle}
      aria-pressed={!paused}
      aria-label={paused ? content.controls.playAria : content.controls.pauseAria}
      data-cursor="link"
    >
      <span className="play-button__dots" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="play-button__ring" aria-hidden="true" />
      <span className="play-button__label mono">{content.controls.play}</span>
    </button>
  );
}
