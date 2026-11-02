/** Turns the custom markdown syntax the lessons use into tags the renderer knows.
 *
 *  :::note{type=intuition title="..."}  ... :::   -> <cb-callout>
 *  :::check  ... :::                              -> <cb-check>
 *  ::widget{id=ohms-law}                          -> <cb-widget>
 *  ::lab{preset=led-basic goal="..."}             -> <cb-lab>
 */
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';

const DIRECTIVE_TAGS: Record<string, string> = {
  note: 'cb-callout',
  check: 'cb-check',
  widget: 'cb-widget',
  lab: 'cb-lab',
};

interface DirectiveNode {
  type: string;
  name: string;
  attributes?: Record<string, string | null | undefined>;
  data?: { hName?: string; hProperties?: Record<string, unknown> };
}

export const remarkCustom: Plugin<[], Root> = () => (tree) => {
  visit(tree, (node) => {
    if (
      node.type !== 'containerDirective' &&
      node.type !== 'leafDirective' &&
      node.type !== 'textDirective'
    ) {
      return;
    }
    const directive = node as unknown as DirectiveNode;
    const tag = DIRECTIVE_TAGS[directive.name];
    if (!tag) return;
    directive.data = {
      ...directive.data,
      hName: tag,
      hProperties: { ...(directive.attributes ?? {}) },
    };
  });
};
