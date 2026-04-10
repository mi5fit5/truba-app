import styles from './Preloader.module.scss';

// TODO: Обновить стилистически прелоадер
export const Preloader = () => (
  <div className={styles.preloader}>
    <div className={styles.preloader_circle} />
  </div>
);