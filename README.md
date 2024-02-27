# HAR Parser

The HAR (HTTP Archive) Parser is a client-side tool designed to analyze and interpret HTTP Archive files, providing detailed insights into a web browser's interactions with a website. This parser emphasizes user privacy and security by operating entirely on the client side, ensuring that no files are stored externally. Users can confidently upload HAR files directly within their web browsers, where the parser processes and extracts valuable information such as requests, responses, timings, and other performance metrics. With a commitment to client-side processing, this HAR Parser offers a secure and transparent solution for developers, performance analysts, and quality assurance engineers seeking to optimize web page loading and troubleshoot performance issues.

## Features

- Analyze and interpret HTTP Archive files directly within the web browser.
- Extract valuable information such as requests, responses, timings, and performance metrics.
- Client-side processing ensures user privacy and security.
- No files are stored externally; everything operates within the browser environment.
- Improved performance with the usage of loops and web workers for workload distribution.

## Fork Information

This project is a fork of the [Cloudflare Har Parser](https://har-sanitizer.pages.dev/) with major improvements such as the usage of loops and web workers to distribute workloads instead of slow regular expressions.

## Usage

1. Clone or download the repository.
2. Open the `index.html` file in your web browser.
3. Upload your HAR file.
4. Analyze the parsed data and gain insights into web page performance.

## Contributions

Contributions are welcome! If you have ideas for improvements or bug fixes, feel free to submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
