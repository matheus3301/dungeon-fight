import { useEffect, useRef, useState } from "react";
import { releasePrecision } from "../shared/throw";
export function LaunchControl({
  disabled,
  onLaunch,
}: {
  disabled: boolean;
  onLaunch: (release: number) => void;
}) {
  const [charging, setCharging] = useState(false),
    [value, setValue] = useState(0),
    [last, setLast] = useState<number | null>(null);
  const started = useRef<number | null>(null),
    raf = useRef(0),
    currentDisabled = useRef(disabled);
  currentDisabled.current = disabled;
  const level = () => {
    const phase =
      ((performance.now() - (started.current ?? performance.now())) % 2400) /
      1200;
    return phase > 1 ? 2 - phase : phase;
  };
  const cancel = () => {
    started.current = null;
    cancelAnimationFrame(raf.current);
    setCharging(false);
  };
  useEffect(() => {
    if (disabled) cancel();
  }, [disabled]);
  useEffect(() => {
    const stop = () => cancel();
    const hidden = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  const begin = () => {
    if (currentDisabled.current || started.current !== null) return;
    started.current = performance.now();
    setCharging(true);
    setValue(0);
    const tick = () => {
      if (started.current === null) return;
      if (performance.now() - started.current > 8000) {
        cancel();
        return;
      }
      setValue(level());
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  const release = () => {
    if (started.current === null) return;
    const result = level();
    cancel();
    setLast(result);
    if (!currentDisabled.current) onLaunch(result);
  };
  const quality = releasePrecision(charging ? value : (last ?? 0));
  return (
    <div className={`launch-control ${charging ? "charging" : ""}`}>
      <div className="release-heading">
        <span>O MOMENTO DO LANÇAMENTO</span>
        <b>
          {charging
            ? quality > 0.88
              ? "Agora! Solte o dado."
              : "Espere a faixa dourada…"
            : last === null
              ? "Mire. Segure. Solte."
              : quality > 0.88
                ? "Boa soltura. O quique decide o resto."
                : "Nova tentativa, novo destino."}
        </b>
      </div>
      <div className="release-meter" aria-hidden="true">
        <div className="release-sweetspot" />
        <span
          style={{ transform: `translateX(${(charging ? value : 0) * 100}%)` }}
        >
          <i />
        </span>
      </div>
      <button
        type="button"
        className="primary launch hold-launch"
        disabled={disabled}
        aria-label="Lançar dado: segure e solte, ou use a barra de espaço"
        aria-describedby="launch-instructions"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          begin();
        }}
        onPointerUp={release}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (!e.repeat) begin();
          }
          if (e.key === "Escape") cancel();
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            release();
          }
        }}
        onBlur={cancel}
        onClick={(e) => {
          if (e.detail === 0) {
            if (started.current === null) begin();
            else release();
          }
        }}
      >
        {charging ? "Solte para lançar ↗" : "Segure para preparar o dado ↗"}
      </button>
      <p id="launch-instructions" className="launch-instructions">
        Segure o botão ou a barra de espaço. Solte na faixa dourada para mais
        precisão. A sorte muda cada quique.
      </p>
      <button
        type="button"
        className="text-button calm-launch"
        disabled={disabled || charging}
        onClick={() => onLaunch(0.45)}
      >
        Lançar sem segurar · precisão moderada
      </button>
    </div>
  );
}
