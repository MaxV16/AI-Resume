class AiResumeBuilder < Formula
  desc "AI-powered CV and cover letter builder with ATS optimization"
  homepage "https://github.com/your-username/AI-Resume"
  url "https://github.com/your-username/AI-Resume/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "PLACEHOLDER"
  license "Apache-2.0"

  def install
    libexec.install "index.html", "styles.css", "app.js"

    (libexec/"run.sh").write <<~EOS
      #!/bin/bash
      open "#{libexec}/index.html"
    EOS
    chmod 0755, libexec/"run.sh"

    bin.install_symlink libexec/"run.sh" => "ai-resume-builder"
  end

  test do
    assert_predicate libexec/"index.html", :exist?
    assert_predicate libexec/"app.js", :exist?
    assert_predicate libexec/"styles.css", :exist?
  end
end
