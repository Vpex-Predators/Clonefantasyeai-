import React from "react";
import { motion } from "framer-motion";

// Route-change transition: gentle fade + rise. The remount is keyed on the
// pathname (see <Routes key> in App.jsx), so exit/enter run through here.
const variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}