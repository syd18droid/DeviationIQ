import ast
import json
import os
import re
from typing import TypedDict

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph

from ai.prompts import (
    ASSESSMENT_PROMPT,
    CHAT_EDIT_PROMPT,
    EXTRACTION_PROMPT,
)

load_dotenv()


class DeviationState(TypedDict):
    deviation_text: str
    extracted_data: dict


llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY"),
)


def clean_assistant_message(message: str) -> str:
    message = message.strip()

    message = re.sub(
        r"```(?:json)?",
        "",
        message,
        flags=re.IGNORECASE,
    )

    message = message.replace("```", "")
    message = message.replace("**", "")
    message = message.replace("__", "")

    message = re.sub(
        r"^\s*#+\s*",
        "",
        message,
    )

    message = re.sub(
        r"^\s*[-*•]\s*",
        "",
        message,
    )

    message = re.sub(
        r"\s+",
        " ",
        message,
    )

    return message.strip()


def parse_ai_data(content: str):
    json_start = content.find("{")

    if json_start == -1:
        return None, ""

    json_text = content[json_start:]

    try:
        parsed_data, json_end = (
            json.JSONDecoder().raw_decode(json_text)
        )

        if isinstance(parsed_data, dict):
            remaining_text = json_text[
                json_end:
            ].strip()

            return parsed_data, remaining_text

    except json.JSONDecodeError:
        pass

    try:
        parsed_data = ast.literal_eval(
            json_text
        )

        if isinstance(parsed_data, dict):
            return parsed_data, ""

    except (ValueError, SyntaxError):
        pass

    closing_brace = content.rfind("}")

    if closing_brace != -1:
        dictionary_text = content[
            json_start:closing_brace + 1
        ]

        try:
            parsed_data = ast.literal_eval(
                dictionary_text
            )

            if isinstance(parsed_data, dict):
                remaining_text = content[
                    closing_brace + 1:
                ].strip()

                return (
                    parsed_data,
                    remaining_text,
                )

        except (ValueError, SyntaxError):
            pass

    return None, ""


def extract_deviation(
    state: DeviationState,
) -> DeviationState:

    prompt = EXTRACTION_PROMPT.format(
        deviation_text=state["deviation_text"]
    )

    response = llm.invoke(prompt)

    content = response.content

    if isinstance(content, list):
        content = "".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict)
        )

    content = str(content).strip()

    parsed_data, _ = parse_ai_data(
        content
    )

    if parsed_data is None:
        raise ValueError(
            "AI returned an invalid extraction response."
        )

    return {
        **state,
        "extracted_data": parsed_data,
    }


def assess_deviation(
    state: DeviationState,
) -> DeviationState:

    prompt = ASSESSMENT_PROMPT.format(
        deviation_data=state["extracted_data"]
    )

    response = llm.invoke(prompt)

    content = response.content

    if isinstance(content, list):
        content = "".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict)
        )

    content = str(content).strip()

    parsed_data, _ = parse_ai_data(
        content
    )

    if parsed_data is None:
        raise ValueError(
            "AI returned an invalid assessment response."
        )

    extracted_data = (
        state["extracted_data"].copy()
    )

    extracted_data[
        "initial_impact"
    ] = parsed_data.get(
        "initial_impact"
    )

    extracted_data[
        "initial_severity"
    ] = parsed_data.get(
        "initial_severity"
    )

    extracted_data[
        "impact_reason"
    ] = parsed_data.get(
        "impact_reason"
    )

    return {
        **state,
        "extracted_data": extracted_data,
    }


def edit_deviation(state: dict) -> dict:

    prompt = CHAT_EDIT_PROMPT.format(
        current_data=state["current_data"],
        user_message=state["user_message"],
    )

    response = llm.invoke(prompt)

    content = response.content

    if isinstance(content, list):
        content = "".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict)
        )

    content = str(content).strip()

    updated_data = (
        state["current_data"].copy()
    )

    assistant_message = (
        "I've processed your request."
    )

    parsed_data, remaining_text = (
        parse_ai_data(content)
    )

    if parsed_data is not None:

        for field, value in parsed_data.items():

            if value is not None:
                updated_data[field] = value

        if remaining_text:

            assistant_message = (
                clean_assistant_message(
                    remaining_text
                )
            )

        else:

            closing_brace = content.rfind(
                "}"
            )

            if closing_brace != -1:

                after_json = content[
                    closing_brace + 1:
                ].strip()

                if after_json:

                    assistant_message = (
                        clean_assistant_message(
                            after_json
                        )
                    )

    else:

        cleaned = (
            clean_assistant_message(
                content
            )
        )

        if cleaned:
            assistant_message = cleaned

    return {
        **state,
        "updated_data": updated_data,
        "assistant_message": assistant_message,
    }


workflow = StateGraph(DeviationState)

workflow.add_node(
    "extract_deviation",
    extract_deviation,
)

workflow.add_node(
    "assess_deviation",
    assess_deviation,
)

workflow.add_edge(
    START,
    "extract_deviation",
)

workflow.add_edge(
    "extract_deviation",
    "assess_deviation",
)

workflow.add_edge(
    "assess_deviation",
    END,
)

deviation_graph = workflow.compile()