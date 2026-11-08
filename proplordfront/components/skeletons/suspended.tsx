import { Suspense, type ComponentType, type ReactNode } from "react";
import { PageSkeleton } from "./page-skeleton";

/**
 * Puts a page's data fetching behind its own Suspense boundary. Navigating between sibling
 * pages only re-renders below the shared layout, so a boundary above the page wouldn't show.
 */
export function suspended<P extends object>(
  Page: (props: P) => Promise<ReactNode> | ReactNode,
  fallback: ReactNode = <PageSkeleton />,
) {
  const Inner = Page as ComponentType<P>;
  return function SuspendedPage(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Inner {...props} />
      </Suspense>
    );
  };
}
