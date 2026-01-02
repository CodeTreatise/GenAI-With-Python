import React from 'react';
import TOC from '@theme-original/TOC';
import type TOCType from '@theme/TOC';

type Props = React.ComponentProps<typeof TOCType>;

const DOC_ATTR = 'data-doc-toc-collapsed';

export default function TOCWrapper(props: Props): JSX.Element {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    if (collapsed) {
      document.documentElement.setAttribute(DOC_ATTR, 'true');
    } else {
      document.documentElement.removeAttribute(DOC_ATTR);
    }

    return () => {
      document.documentElement.removeAttribute(DOC_ATTR);
    };
  }, [collapsed]);

  return (
    <div className="tocCollapseWrapper">
      <button
        type="button"
        className="tocCollapseButton"
        aria-pressed={collapsed}
        aria-label={collapsed ? 'Expand table of contents' : 'Collapse table of contents'}
        title={collapsed ? 'Show table of contents' : 'Hide table of contents'}
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="tocCollapseIcon" aria-hidden="true">
          {collapsed ? '›' : '‹'}
        </span>
      </button>

      {!collapsed && <TOC {...props} />}
    </div>
  );
}
