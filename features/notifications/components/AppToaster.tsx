"use client";

import { Toaster } from "sonner";
import styles from "./AppToaster.module.css";

/** A single feedback surface, retained while application routes change. */
export default function AppToaster() {
  return (
    <>
      <div className="showup-notification-idle" aria-hidden="true" />
      <Toaster
        position="bottom-center"
        offset="86px"
        mobileOffset={{ bottom: "86px", left: "16px", right: "16px" }}
        duration={2800}
        visibleToasts={1}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: styles.toast,
            content: styles.content,
            description: styles.description,
          },
        }}
      />
    </>
  );
}
