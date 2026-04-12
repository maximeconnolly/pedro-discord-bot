export const noopProvider = {
  name: 'noop',
  async chat(_messages) {
    return 'AI chatbot is not configured yet.';
  },
};
