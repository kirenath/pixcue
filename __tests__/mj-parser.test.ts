// __tests__/mj-parser.test.ts — MJ/Niji 解析器单元测试

import { describe, it, expect } from "vitest";
import { parseMjPrompt } from "../src/lib/mj-parser";

describe("parseMjPrompt", () => {
  // ---- 基础功能 ----

  it("解析标准 MJ prompt (PRD 示例)", () => {
    const result = parseMjPrompt(
      "a cute cat --ar 16:9 --v 6.1 --s 500 --style raw --seed 12345 --no text"
    );
    expect(result.prompt_text).toBe("a cute cat");
    expect(result.platform).toBe("midjourney");
    expect(result.params.mj_version).toBe("6.1");
    expect(result.params.mj_aspect_ratio).toBe("16:9");
    expect(result.params.mj_stylize).toBe(500);
    expect(result.params.mj_style).toBe("raw");
    expect(result.params.mj_seed).toBe(12345);
    expect(result.params.mj_no).toBe("text");
  });

  it("解析所有支持的参数", () => {
    const result = parseMjPrompt(
      "fantasy landscape --ar 2:3 --v 7 --s 800 --chaos 50 --seed 99999 --q 0.5 --tile --stop 80 --weird 1500 --repeat 4 --style raw --iw 1.5 --cw 75"
    );
    expect(result.params.mj_aspect_ratio).toBe("2:3");
    expect(result.params.mj_version).toBe("7");
    expect(result.params.mj_stylize).toBe(800);
    expect(result.params.mj_chaos).toBe(50);
    expect(result.params.mj_seed).toBe(99999);
    expect(result.params.mj_quality).toBe(0.5);
    expect(result.params.mj_tile).toBe(true);
    expect(result.params.mj_stop).toBe(80);
    expect(result.params.mj_weird).toBe(1500);
    expect(result.params.mj_repeat).toBe(4);
    expect(result.params.mj_style).toBe("raw");
    expect(result.params.mj_iw).toBe(1.5);
    expect(result.params.mj_cw).toBe(75);
  });

  // ---- 边界情况 ----

  it("空输入", () => {
    const result = parseMjPrompt("");
    expect(result.prompt_text).toBe("");
    expect(result.platform).toBe("midjourney");
    expect(result.params).toEqual({});
    expect(result.mj_raw_params).toBe("");
  });

  it("纯空白输入", () => {
    const result = parseMjPrompt("   ");
    expect(result.prompt_text).toBe("");
    expect(result.params).toEqual({});
  });

  it("纯 prompt 无参数", () => {
    const result = parseMjPrompt("a beautiful sunset over the ocean");
    expect(result.prompt_text).toBe("a beautiful sunset over the ocean");
    expect(result.params).toEqual({});
    expect(result.mj_raw_params).toBe("");
  });

  it("纯参数无 prompt", () => {
    const result = parseMjPrompt("--ar 1:1 --v 6.1");
    expect(result.prompt_text).toBe("");
    expect(result.params.mj_aspect_ratio).toBe("1:1");
    expect(result.params.mj_version).toBe("6.1");
  });

  // ---- 参数无空格 (--ar16:9, --v6.1 等) ----

  it("参数无空格: --ar16:9", () => {
    const result = parseMjPrompt("a cat --ar16:9");
    expect(result.params.mj_aspect_ratio).toBe("16:9");
    expect(result.prompt_text).toBe("a cat");
  });

  it("参数无空格: --v6.1", () => {
    const result = parseMjPrompt("a cat --v6.1");
    expect(result.params.mj_version).toBe("6.1");
  });

  // ---- --niji 平台识别 ----

  it("--niji 标志: 带版本号", () => {
    const result = parseMjPrompt("anime girl --niji 6 --ar 1:1");
    expect(result.platform).toBe("nijijourney");
    expect(result.params.mj_version).toBe("6");
    expect(result.params.mj_aspect_ratio).toBe("1:1");
  });

  it("--niji 标志: 不带版本号", () => {
    const result = parseMjPrompt("anime girl --niji --ar 1:1");
    expect(result.platform).toBe("nijijourney");
  });

  // ---- --v 与 --version 同义 ----

  it("--version 等同于 --v", () => {
    const result = parseMjPrompt("a dog --version 7");
    expect(result.params.mj_version).toBe("7");
  });

  // ---- --s 与 --stylize 同义 ----

  it("--stylize 等同于 --s", () => {
    const result = parseMjPrompt("a fish --stylize 250");
    expect(result.params.mj_stylize).toBe(250);
  });

  // ---- --p 个性化 ----

  it("--p 带值", () => {
    const result = parseMjPrompt("a scene --p abc123 --ar 1:1");
    expect(result.params.mj_personalize).toBe("abc123");
  });

  it("--p 单独出现 (使用默认 profile)", () => {
    const result = parseMjPrompt("a scene --p --ar 1:1");
    expect(result.params.mj_personalize).toBe("default");
  });

  it("--profile 带值 (等同于 --p)", () => {
    const result = parseMjPrompt("a scene --profile lm9rorl --ar 1:1");
    expect(result.params.mj_personalize).toBe("lm9rorl");
  });

  it("--profile 在 niji prompt 中正确解析", () => {
    const result = parseMjPrompt(
      "character design sheet, 1 20-years-old male, purple hair, bob cut, purple eyes, cowboy shot, detailed eyes, long detailed beautiful eyelashes --ar 9:16 --profile lm9rorl --stylize 450 --niji 6"
    );
    expect(result.params.mj_personalize).toBe("lm9rorl");
    expect(result.params.mj_aspect_ratio).toBe("9:16");
    expect(result.params.mj_stylize).toBe(450);
    expect(result.platform).toBe("nijijourney");
    expect(result.params.mj_version).toBe("6");
    expect(result.prompt_text).toBe(
      "character design sheet, 1 20-years-old male, purple hair, bob cut, purple eyes, cowboy shot, detailed eyes, long detailed beautiful eyelashes"
    );
  });

  // ---- --sref 多值 ----

  it("--sref 多值 (空格分隔的 URL)", () => {
    const result = parseMjPrompt(
      "a painting --sref https://example.com/1.jpg https://example.com/2.jpg --ar 1:1"
    );
    expect(result.params.mj_sref).toBe(
      "https://example.com/1.jpg https://example.com/2.jpg"
    );
  });

  // ---- prompt 中含 URL ----

  it("prompt 中的 URL 不被误识别为参数", () => {
    const result = parseMjPrompt(
      "https://example.com/reference.jpg a cute cat --ar 1:1"
    );
    expect(result.prompt_text).toBe(
      "https://example.com/reference.jpg a cute cat"
    );
    expect(result.params.mj_aspect_ratio).toBe("1:1");
  });

  // ---- --no 后跟多词 ----

  it("--no 贪婪匹配到下一个 --", () => {
    const result = parseMjPrompt(
      "a scene --no text, watermark, blur --ar 1:1"
    );
    expect(result.params.mj_no).toBe("text, watermark, blur");
    expect(result.params.mj_aspect_ratio).toBe("1:1");
  });

  it("--no 贪婪匹配到字符串末尾", () => {
    const result = parseMjPrompt("a scene --ar 1:1 --no text, watermark");
    expect(result.params.mj_no).toBe("text, watermark");
  });

  // ---- 重复参数 (后值覆盖前值) ----

  it("重复参数: 后值覆盖前值", () => {
    const result = parseMjPrompt("a cat --ar 1:1 --ar 16:9");
    expect(result.params.mj_aspect_ratio).toBe("16:9");
  });

  // ---- Niji 特有 style ----

  it("Niji style: cute", () => {
    const result = parseMjPrompt("anime girl --niji 6 --style cute");
    expect(result.platform).toBe("nijijourney");
    expect(result.params.mj_style).toBe("cute");
  });

  // ---- 复杂综合场景 ----

  it("复杂综合场景: MJ V7 with sref + cref + no", () => {
    const result = parseMjPrompt(
      "epic dragon battle, cinematic lighting --v 7 --ar 16:9 --s 750 --chaos 30 --sref https://ref.com/style.jpg --cref https://ref.com/char.jpg --cw 80 --no text, watermark --seed 42"
    );
    expect(result.prompt_text).toBe("epic dragon battle, cinematic lighting");
    expect(result.platform).toBe("midjourney");
    expect(result.params.mj_version).toBe("7");
    expect(result.params.mj_aspect_ratio).toBe("16:9");
    expect(result.params.mj_stylize).toBe(750);
    expect(result.params.mj_chaos).toBe(30);
    expect(result.params.mj_sref).toBe("https://ref.com/style.jpg");
    expect(result.params.mj_cref).toBe("https://ref.com/char.jpg");
    expect(result.params.mj_cw).toBe(80);
    expect(result.params.mj_no).toBe("text, watermark");
    expect(result.params.mj_seed).toBe(42);
  });

  // ---- raw_params 字符串 ----

  it("mj_raw_params 包含所有参数", () => {
    const result = parseMjPrompt("a cat --ar 1:1 --v 6.1");
    expect(result.mj_raw_params).toContain("--ar 1:1");
    expect(result.mj_raw_params).toContain("--v 6.1");
  });
});
