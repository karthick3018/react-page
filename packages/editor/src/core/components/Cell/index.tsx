import React from 'react';
import classNames from 'classnames';
import {
  useCellHasPlugin,
  useCellProps,
  useIsEditMode,
  useIsFocused,
  useIsLayoutMode,
  useIsPreviewMode,
  useIsResizeMode,
  useLang,
  useNodeHasChildren,
  useScrollToViewEffect,
} from '../hooks';
import ErrorCell from './ErrorCell';
import Inner from './Inner';
import scrollIntoViewWithOffset from './utils/scrollIntoViewWithOffset';
import Handle from './Handle';

const gridClass = ({
  isPreviewMode,
  isEditMode,
  size,
}: {
  isPreviewMode: boolean;
  isEditMode: boolean;
  size: number;
}): string => {
  if (isPreviewMode || isEditMode) {
    return `react-page-cell-${isPreviewMode || isEditMode ? 'sm' : 'xs'}-${
      size || 12
    } react-page-cell-xs-12`;
  }

  return `react-page-cell-xs-${size || 12}`;
};

const stopClick = (_isEditMode: boolean) => (
  e: React.MouseEvent<HTMLDivElement>
) => (_isEditMode ? e.stopPropagation() : null);

const CellErrorGate = class extends React.Component<
  {
    nodeId: string;
  },
  { error: Error }
> {
  state = {
    error: null,
  };
  componentDidCatch(error: Error) {
    this.setState({ error });
  }

  render() {
    if (this.state.error) {
      return <ErrorCell nodeId={this.props.nodeId} error={this.state.error} />;
    }
    return this.props.children;
  }
};

type Props = {
  nodeId: string;
  measureRef?: React.Ref<HTMLDivElement>;
};
const Cell: React.FC<Props> = ({ nodeId, measureRef }) => {
  const focused = useIsFocused(nodeId);

  const {
    inline,
    hasInlineNeighbour,
    isDraft,
    isDraftI18n,
    size,
  } = useCellProps(
    nodeId,
    ({ inline, hasInlineNeighbour, isDraft, isDraftI18n, size }) => ({
      inline,
      hasInlineNeighbour,
      isDraft,
      isDraftI18n,
      size,
    })
  );

  const lang = useLang();
  const isPreviewMode = useIsPreviewMode();
  const isResizeMode = useIsResizeMode();
  const isEditMode = useIsEditMode();
  const isLayoutMode = useIsLayoutMode();
  const hasChildren = useNodeHasChildren(nodeId);
  const hasPlugin = useCellHasPlugin(nodeId);

  const isDraftInLang = isDraftI18n?.[lang] ?? isDraft;
  const ref = React.useRef<HTMLDivElement>();
  useScrollToViewEffect(
    nodeId,
    () => {
      if (ref.current) scrollIntoViewWithOffset(ref.current, 120); // 120 is just a sane default, we might make int configurable in the future
    },
    [ref.current]
  );
  if (isDraftInLang && isPreviewMode) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={classNames(
        'react-page-cell',

        gridClass({
          isEditMode,
          isPreviewMode,
          size,
        }),
        {
          'react-page-cell-has-inline-neighbour': hasInlineNeighbour,
          'react-page-cell-has-plugin': hasPlugin,
          'react-page-cell-leaf': !hasChildren,
          [`react-page-cell-inline-${inline || ''}`]: inline,
          'react-page-cell-focused': focused,
          'react-page-cell-is-draft': isDraftInLang,
          'react-page-cell-bring-to-front':
            !isResizeMode && !isLayoutMode && inline, // inline must not be active for resize/layout
        }
      )}
      onClick={stopClick(hasPlugin && isEditMode)}
    >
      <Handle nodeId={nodeId} />
      <div
        ref={measureRef}
        style={{
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <CellErrorGate nodeId={nodeId}>
          <Inner nodeId={nodeId} />
        </CellErrorGate>
      </div>
    </div>
  );
};

export default React.memo(Cell);
