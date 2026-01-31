import { setProjectAnnotations } from '@storybook/react-vite';
import { configure } from '@testing-library/react';
import * as previewAnnotations from './preview';

// Configure Testing Library to use data-test-id attribute (matches CLAUDE.md standard)
configure({ testIdAttribute: 'data-test-id' });

const annotations = setProjectAnnotations([previewAnnotations]);

export { annotations };
