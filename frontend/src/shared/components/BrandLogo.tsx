import styles from "./BrandLogo.module.css";

export default function BrandLogo({ size = 28 }: { size?: number }) {
  return (
    <span className={styles.brand}>
      <img src="/logo-icon.png" alt="" width={size} height={size} className={styles.icon} />
      <strong className={styles.wordmark}>TURRITOPSIS</strong>
    </span>
  );
}
