import styles from "./Loader3D.module.css";

const BOXES = [0, 1, 2, 3];
const FACES = [0, 1, 2, 3];

/**
 * Loader 3D de cubos girando, usado em telas de espera mais longas
 * (ex: processamento de IA). Adaptado de um componente da Uiverse.io.
 */
export default function Loader3D({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-4">
      <div className={styles.wrapper}>
        <div className={styles.boxes}>
          {BOXES.map((box) => (
            <div key={box} className={styles.box}>
              {FACES.map((face) => (
                <div key={face} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {message && (
        <p className="max-w-xs text-center text-sm text-white/70">{message}</p>
      )}
    </div>
  );
}
