import React from 'react';
import styles from "../LivenessCheckStep.module.css";

export const CameraFrame = () => (
  <div className={styles.cameraFrame}>
    <div className={`${styles.cameraCorner} ${styles.topLeft}`} />
    <div className={`${styles.cameraCorner} ${styles.topRight}`} />
    <div className={`${styles.cameraCorner} ${styles.bottomLeft}`} />
    <div className={`${styles.cameraCorner} ${styles.bottomRight}`} />
  </div>
); 