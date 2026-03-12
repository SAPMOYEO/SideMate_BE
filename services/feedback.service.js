const Feedback = require("../model/Feedback");
const AiQuota = require("../model/AiQuota");
const aiUsageService = require("./aiUsage.service");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

// 프롬프트에 안전하게 넣기 위한 값 정리
function safeField(value) {
  // 배열이라면 -> "a, b, c, d"
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "없음";
  }

  // null, undefined인 경우
  if (value === null || value === undefined) {
    return "없음";
  }

  // 빈 문자열
  const text = String(value).trim();
  return text ? text : "없음";
}

// 모집 역할 배열을 프롬프트용 문자열로 변환
function formatRecruitRoles(recruitRoles) {
  if (!Array.isArray(recruitRoles) || recruitRoles.length === 0) {
    return "없음";
  }

  return recruitRoles.map((item) => `${item.role} ${item.cnt}명`).join(", ");
}

// Gemini 프롬프트 생성
function buildPrompts(inputSnapshot) {
  const systemPrompt = `
당신은 사이드 프로젝트 경험이 많은 시니어 개발 멘토입니다.
사용자가 작성한 사이드 프로젝트 모집 글을 분석하고,
팀원을 더 잘 모집할 수 있도록 실질적인 피드백을 제공하세요.

반드시 JSON 형식으로만 응답하세요.

데이터 구조 규칙:
1. "strengths"는 문자열 배열이어야 합니다.
2. "weaknesses"는 문자열 배열이어야 합니다.
3. "suggestions"는 문자열 배열이어야 합니다.
4. 각 배열에는 1개 이상 3개 이하의 항목만 포함하세요.
5. 각 항목은 자연스럽고 이해하기 쉬운 한국어 문장으로 작성하세요.
6. 점수, 별점, 숫자 평가, 등급은 절대 포함하지 마세요.
7. JSON 외의 다른 문장은 절대 포함하지 마세요.

분석 기준:
- 프로젝트 목표가 명확한지
- 프로젝트 기간이 현실적인지
- 기술 스택이 프로젝트 목적에 적절한지
- 모집 역할 구성이 균형 잡혀 있는지
- 다른 개발자가 참여하고 싶을 만큼 매력적인지

작성 원칙:
- 입력 정보가 부족하면 추측하지 말고 보완이 필요한 점으로 반영하세요.
- 비판만 하지 말고, 실제로 개선 가능한 방향을 제안하세요.
- 피드백은 친절하고 실용적인 개발 멘토의 말투로 작성하세요.
  `.trim();

  const userPrompt = `
다음은 사용자가 작성한 사이드 프로젝트 모집 글입니다.

프로젝트 제목: ${safeField(inputSnapshot.title)}
카테고리: ${safeField(inputSnapshot.category)}
프로젝트 설명: ${safeField(inputSnapshot.description)}
프로젝트 목표: ${safeField(inputSnapshot.goal)}
예상 기간: ${safeField(inputSnapshot.startDate)} ~ ${safeField(inputSnapshot.endDate)}
기술 스택(권장): ${safeField(inputSnapshot.requiredTechStack)}
기술 스택(필수): ${safeField(inputSnapshot.mandatoryTechStack)}
모집 역할: ${formatRecruitRoles(inputSnapshot.recruitRoles)}
총 모집 인원: ${safeField(inputSnapshot.totalCnt)}
모집 마감일: ${safeField(inputSnapshot.deadline)}
소통 방식: ${safeField(inputSnapshot.communicationMethod)}
깃허브 주소: ${safeField(inputSnapshot.gitUrl)}

위 내용을 바탕으로 모집글 피드백을 JSON 형식으로 작성하세요.
  `.trim();

  return { systemPrompt, userPrompt };
}

// Gemini 응답에서 text 추출
function extractGeminiText(data) {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// JSON 파싱 + 코드블록 방어
function parseJsonSafely(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const cleaned = text
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    return JSON.parse(cleaned);
  }
}

// 문자열 배열 정리
function normalizeStringArray(value, fallback) {
  if (!Array.isArray(value)) {
    return [fallback];
  }

  // 문자열만, 공백 제거, 최대 3개까지 사용, 비어있으면 fallback 사용
  const cleaned = value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 3);

  return cleaned.length > 0 ? cleaned : [fallback];
}

// Gemini 응답 검증 / fallback
function validateFeedbackResponse(parsed) {
  return {
    strengths: normalizeStringArray(
      parsed?.strengths,
      "프로젝트의 기본 방향은 어느 정도 드러나 있습니다.",
    ),
    weaknesses: normalizeStringArray(parsed?.weaknesses, "조금 더 구체적인 설명이 필요합니다."),
    suggestions: normalizeStringArray(
      parsed?.suggestions,
      "핵심 기능과 역할 구성을 조금 더 구체적으로 작성해보세요.",
    ),
  };
}

// quota summary 조회용
async function getQuotaSummary(userId) {
  const quota = await AiQuota.findOne({ userId });

  if (!quota) {
    return {
      quota: null,
      summary: {
        freeRemaining: 0,
        topUpRemaining: 0,
        subExtraRemaining: 0,
        totalRemaining: 0,
        totalUsed: 0,
        subExtraResetAt: null,
      },
    };
  }

  const totalRemaining =
    (quota.freeRemaining || 0) + (quota.topUpRemaining || 0) + (quota.subExtraRemaining || 0);

  return {
    quota,
    summary: {
      freeRemaining: quota.freeRemaining,
      topUpRemaining: quota.topUpRemaining,
      subExtraRemaining: quota.subExtraRemaining,
      totalRemaining,
      totalUsed: quota.totalUsed,
      subExtraResetAt: quota.subExtraResetAt,
    },
  };
}

// Gemini 호출
async function requestGeminiFeedback(inputSnapshot) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY_NOT_FOUND");
  }

  const { systemPrompt, userPrompt } = buildPrompts(inputSnapshot);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GEMINI_REQUEST_FAILED: ${errorText}`);
  }

  const data = await response.json();
  const rawText = extractGeminiText(data);

  if (!rawText) {
    throw new Error("EMPTY_GEMINI_RESPONSE");
  }

  const parsed = parseJsonSafely(rawText);
  const normalized = validateFeedbackResponse(parsed);

  return {
    rawText,
    normalized,
  };
}

/**
 * 피드백 생성 메인 로직
 *
 * 흐름:
 * 1. createHold() → quota 예약
 * 2. Gemini 호출
 * 3. Feedback 저장
 * 4. commitHold() → 실제 차감 확정
 * 5. 결과 반환
 *
 * 실패 시:
 * - Gemini 실패 / DB 저장 실패 → cancelHold()
 * - 즉, 실패 차감 0 보장
 */
async function requestProjectFeedbackAndSave({
  userId,
  projectId = null,
  requestId,
  tempProjectId,
  type = "recruit",
  inputSnapshot,
}) {
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  if (!requestId) {
    throw new Error("REQUEST_ID_REQUIRED");
  }

  if (!tempProjectId) {
    throw new Error("TEMP_PROJECT_ID_REQUIRED");
  }

  if (!inputSnapshot) {
    throw new Error("INPUT_SNAPSHOT_REQUIRED");
  }

  // 1. 먼저 HOLD 생성
  // 아직 실제 차감은 아니고 "예약"만 잡는다. -> 오류가 있을 수 있으니까
  await aiUsageService.createHold({
    userId,
    requestId,
    postId: projectId || undefined,
  });

  try {
    // 2. Gemini 호출
    const { rawText, normalized } = await requestGeminiFeedback(inputSnapshot);

    // 3. Feedback 저장
    const savedFeedback = await Feedback.create({
      user: userId,
      project: projectId,
      tempProjectId,
      type,
      strengths: normalized.strengths,
      weaknesses: normalized.weaknesses,
      suggestions: normalized.suggestions,

      // 배열로 저장
      fullResponse: [rawText],

      inputSnapshot: {
        title: inputSnapshot.title,
        category: inputSnapshot.category,
        description: inputSnapshot.description,
        goal: inputSnapshot.goal,
        startDate: inputSnapshot.startDate,
        endDate: inputSnapshot.endDate,
        requiredTechStack: inputSnapshot.requiredTechStack || [],
        mandatoryTechStack: inputSnapshot.mandatoryTechStack || [],
        recruitRoles: inputSnapshot.recruitRoles || [],
        totalCnt: inputSnapshot.totalCnt,
        deadline: inputSnapshot.deadline,
        communicationMethod: inputSnapshot.communicationMethod,
        gitUrl: inputSnapshot.gitUrl || "",
      },
    });

    // 4. 저장까지 성공했으면 COMMIT
    await aiUsageService.commitHold({
      userId,
      requestId,
    });

    // 5. 최신 quota 조회
    const { quota, summary } = await getQuotaSummary(userId);

    return {
      feedbackId: savedFeedback._id,
      feedback: {
        strengths: savedFeedback.strengths,
        weaknesses: savedFeedback.weaknesses,
        suggestions: savedFeedback.suggestions,
      },
      quota,
      summary,
    };
  } catch (error) {
    // 중간에 하나라도 실패하면 예약 해제
    try {
      await aiUsageService.cancelHold({
        userId,
        requestId,
        reason: "FAILED",
        errorMessage: error.message,
      });
    } catch (cancelError) {
      console.error("AI HOLD 취소 실패:", cancelError.message);
    }

    throw error;
  }
}

module.exports = {
  requestProjectFeedbackAndSave,
};
