import styles from "./page-placeholder.module.css";

export default function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.wrap}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
