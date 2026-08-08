import type { Preview } from "@storybook/react";
import { ConfigProvider } from "antd";
import zhTW from "antd/locale/zh_TW";

import "antd/dist/reset.css";
import "github-markdown-css/github-markdown.css";
import "bytemd/dist/index.css";
import "highlight.js/styles/vs.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <ConfigProvider locale={zhTW}>
        <Story />
      </ConfigProvider>
    ),
  ],
};

export default preview;
