import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  analyzeDeviation,
  analyzeDeviationPdf,
  chatWithDeviationCopilot,
  saveDeviation,
} from "./api/deviationApi";

import {
  clearDeviation,
  setDeviation,
} from "./store/deviationSlice";

function App() {
  const dispatch = useDispatch();

  const result = useSelector(
    (state) => state.deviation.data
  );

  const fileInputRef = useRef(null);

  const [deviationText, setDeviationText] =
    useState("");
  const [selectedFile, setSelectedFile] =
    useState("");
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] =
    useState(false);
  const [chatLoading, setChatLoading] =
    useState(false);
  const [saveSuccess, setSaveSuccess] =
    useState(false);

  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] =
    useState("");

  const handleAnalyze = async () => {
    if (!deviationText.trim()) return;

    setLoading(true);
    setSaveSuccess(false);

    try {
      const data = await analyzeDeviation(
        deviationText
      );

      dispatch(setDeviation(data));

      setMessages([
        {
          role: "user",
          content: "Analyze this deviation.",
        },
        {
          role: "assistant",
          content:
            "I've analyzed the deviation and populated the form. Please review the extracted information and initial assessment. You can ask me to make changes here.",
        },
      ]);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze deviation.");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setSelectedFile(file.name);
    setPdfLoading(true);
    setSaveSuccess(false);

    setProgress(10);
    setProgressStage("Uploading document...");

    const progressTimer = setInterval(() => {
      setProgress((current) => {
        if (current < 35) {
          setProgressStage(
            "Extracting PDF text..."
          );
          return current + 5;
        }

        if (current < 75) {
          setProgressStage(
            "AI is analyzing the deviation..."
          );
          return current + 3;
        }

        if (current < 90) {
          setProgressStage(
            "Preparing extracted information..."
          );
          return current + 2;
        }

        return current;
      });
    }, 300);

    try {
      const data = await analyzeDeviationPdf(
        file
      );

      clearInterval(progressTimer);

      setProgress(100);
      setProgressStage("Extraction complete");

      setDeviationText(data.text || "");

      dispatch(
        setDeviation(
          data.extracted_data || null
        )
      );

      setMessages([
        {
          role: "user",
          content: `Analyze the uploaded document: ${file.name}`,
        },
        {
          role: "assistant",
          content:
            "I've extracted and analyzed the deviation document. The relevant information and initial impact/severity assessment have been populated in the form. You can ask me to review or change any field.",
        },
      ]);
    } catch (error) {
      clearInterval(progressTimer);

      console.error(error);
      alert("Failed to analyze PDF.");

      setSelectedFile("");
      setProgress(0);
      setProgressStage("");
    } finally {
      setTimeout(() => {
        setPdfLoading(false);
        setProgress(0);
        setProgressStage("");
      }, 800);

      event.target.value = "";
    }
  };

  const handleChatSubmit = async () => {
    const message = chatInput.trim();

    if (
      !message ||
      !result ||
      chatLoading
    ) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: message,
      },
    ]);

    setChatInput("");
    setChatLoading(true);
    setSaveSuccess(false);

    try {
      const response =
        await chatWithDeviationCopilot(
          result,
          message
        );

      dispatch(
        setDeviation(
          response.updated_data
        )
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            response.assistant_message,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I couldn't update the deviation. Please try describing the change again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleChatSubmit();
    }
  };

  const handleReset = () => {
    setDeviationText("");
    setSelectedFile("");
    setMessages([]);
    setChatInput("");
    setProgress(0);
    setProgressStage("");
    setSaveSuccess(false);

    dispatch(clearDeviation());
  };

  const handleRemoveFile = () => {
    setSelectedFile("");
    setDeviationText("");
    setMessages([]);
    setSaveSuccess(false);

    dispatch(clearDeviation());
  };

  const handleSave = async () => {
    if (!result) {
      alert(
        "Analyze a deviation before saving."
      );
      return;
    }

    try {
      await saveDeviation(result);

      setSaveSuccess(true);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert("Failed to save deviation.");
    }
  };

  return (
    <div className="app">
      <h1>DeviationIQ</h1>

      <div className="layout">
        <section className="form-panel">
          <h2>Log Deviation</h2>

          {result && (
            <div className="ai-review-badge">
              ✦ AI populated — Review through
              Copilot before saving
            </div>
          )}

          <div className="form-grid">
            <div className="field">
              <label>Site / Plant</label>

              <input
                value={result?.site_plant || ""}
                readOnly
              />
            </div>

            <div className="field">
              <label>
                Date of Occurrence
              </label>

              <input
                value={
                  result?.date_of_occurrence ||
                  ""
                }
                readOnly
              />
            </div>

            <div className="field">
              <label>
                Title / Short Description
              </label>

              <input
                value={result?.title || ""}
                readOnly
              />
            </div>

            <div className="field">
              <label>Source</label>

              <input
                value={result?.source || ""}
                readOnly
              />
            </div>

            <div className="field">
              <label>
                Related Product / Material
              </label>

              <input
                value={
                  result?.related_product_material ||
                  ""
                }
                readOnly
              />
            </div>

            <div className="field">
              <label>
                Batch / Lot Number
              </label>

              <input
                value={
                  result?.batch_lot_number || ""
                }
                readOnly
              />
            </div>

            <div className="field full-width">
              <label>
                Detailed Description
              </label>

              <textarea
                value={
                  result?.detailed_description ||
                  ""
                }
                readOnly
                rows={5}
              />
            </div>

            <div className="field">
              <label>Initial Impact</label>

              <textarea
                value={
                  result?.initial_impact || ""
                }
                readOnly
                rows={3}
              />
            </div>

            <div className="field">
              <label>Initial Severity</label>

              <input
                value={
                  result?.initial_severity || ""
                }
                readOnly
              />
            </div>

            <div className="field full-width">
              <label>Impact Reason</label>

              <textarea
                value={
                  result?.impact_reason || ""
                }
                readOnly
                rows={3}
              />
            </div>
          </div>

          {saveSuccess && (
            <div className="save-success">
              ✓ Deviation saved successfully
            </div>
          )}

          <div className="form-actions">
            <button
              className="reset-button"
              onClick={handleReset}
            >
              Reset Form
            </button>

            <button
              className="save-button"
              onClick={handleSave}
            >
              Save Deviation
            </button>
          </div>
        </section>

        <section className="copilot-panel">
          <div className="copilot-header">
            <div className="copilot-icon">
              ✦
            </div>

            <div>
              <h2>Deviation Copilot</h2>

              <p>
                AI-powered deviation assistant
              </p>
            </div>

            <div className="copilot-status">
              <span></span>

              {chatLoading
                ? "Thinking"
                : "Ready"}
            </div>
          </div>

          <div className="chat-area">
            {messages.length === 0 && (
              <div className="chat-empty">
                <div className="welcome-icon">
                  ✦
                </div>

                <h3>
                  Deviation Copilot
                </h3>

                <p>
                  Upload a deviation document
                  or paste the deviation details
                  below to get started.
                </p>
              </div>
            )}

            {messages.map(
              (message, index) => (
                <div
                  key={index}
                  className={`chat-message ${
                    message.role === "user"
                      ? "user-message"
                      : "assistant-message"
                  }`}
                >
                  {message.role ===
                    "assistant" && (
                    <div className="message-avatar">
                      ✦
                    </div>
                  )}

                  <div className="message-content">
                    {message.content}
                  </div>
                </div>
              )
            )}

            {chatLoading && (
              <div className="chat-message assistant-message">
                <div className="message-avatar">
                  ✦
                </div>

                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          <div className="copilot-bottom">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              hidden
            />

            <button
              className="upload-card"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={pdfLoading}
            >
              <div className="upload-card-icon">
                ↑
              </div>

              <div className="upload-card-content">
                <strong>
                  {pdfLoading
                    ? "Analyzing document..."
                    : "Upload deviation document"}
                </strong>

                <span>
                  {pdfLoading
                    ? "Extracting information with AI"
                    : "PDF files supported"}
                </span>
              </div>

              <div className="upload-arrow">
                ›
              </div>
            </button>

            {pdfLoading && (
              <div className="extraction-progress">
                <div className="progress-info">
                  <span>
                    {progressStage}
                  </span>

                  <strong>
                    {progress}%
                  </strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {selectedFile &&
              !pdfLoading && (
                <div className="file-chip">
                  <span>PDF</span>

                  <p>
                    {selectedFile}
                  </p>

                  <button
                    onClick={
                      handleRemoveFile
                    }
                  >
                    ×
                  </button>
                </div>
              )}

            <div className="deviation-input">
              <div className="input-label">
                <span>
                  Deviation details
                </span>

                <span className="input-hint">
                  Paste or type the deviation
                </span>
              </div>

              <textarea
                value={deviationText}
                onChange={(event) =>
                  setDeviationText(
                    event.target.value
                  )
                }
                placeholder="Paste deviation details, observations, process parameters, affected batch information, or other relevant notes..."
                rows={5}
              />

              <div className="deviation-input-footer">
                <span>
                  AI will extract and assess
                  the deviation
                </span>

                <button
                  className="analyze-button"
                  onClick={handleAnalyze}
                  disabled={
                    loading ||
                    !deviationText.trim()
                  }
                >
                  {loading
                    ? "Analyzing..."
                    : "Analyze"}

                  <span>→</span>
                </button>
              </div>
            </div>

            <div className="chat-input-container">
              <textarea
                value={chatInput}
                onChange={(event) =>
                  setChatInput(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleChatKeyDown
                }
                disabled={
                  !result ||
                  chatLoading
                }
                placeholder={
                  result
                    ? "Ask me to change something..."
                    : "Analyze a deviation to start chatting..."
                }
                rows={2}
              />

              <div className="chat-input-footer">
                <span>
                  {result
                    ? "Ask Copilot to edit the form"
                    : "Copilot editing starts after analysis"}
                </span>

                <button
                  className="send-button"
                  onClick={
                    handleChatSubmit
                  }
                  disabled={
                    !result ||
                    !chatInput.trim() ||
                    chatLoading
                  }
                >
                  ↑
                </button>
              </div>
            </div>
          </div>

          <p className="ai-disclaimer">
            AI may make mistakes. Please verify
            information before saving.
          </p>
        </section>
      </div>
    </div>
  );
}

export default App;