import { ToolDefinition } from '../types/types';

export const toolRegistry: Record<string, ToolDefinition> = {
  add_prefix: {
    name: 'Add Prefix',
    description: 'Adds a prefix to the input text',
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The text to add prefix to',
      },
      {
        name: 'prefix',
        type: 'string',
        required: true,
        description: 'The prefix to add',
      },
    ],
    returns: {
      type: 'string',
      description: 'The text with prefix added',
    },
  },
  to_upper: {
    name: 'To Upper Case',
    description: 'Converts text to upper case',
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The text to convert to upper case',
      },
    ],
    returns: {
      type: 'string',
      description: 'The text in upper case',
    },
  },
  select_text: {
    name: 'Select Text',
    description: 'Selects text based on a condition',
    parameters: [
      {
        name: 'condition',
        type: 'boolean',
        required: true,
        description: 'The condition to evaluate',
      },
      {
        name: 'trueValue',
        type: 'string',
        required: true,
        description: 'The text to return if condition is true',
      },
      {
        name: 'falseValue',
        type: 'string',
        required: true,
        description: 'The text to return if condition is false',
      },
    ],
    returns: {
      type: 'string',
      description: 'The selected text',
    },
  },
};
