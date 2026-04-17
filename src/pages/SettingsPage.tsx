import { SettingSelect } from "../components/SettingSelect";
import { wordCategoryLabels } from "../data/content";
import { SettingsState } from "../types";

interface SettingsPageProps {
  settings: SettingsState;
  onChange: (next: SettingsState) => void;
}

export function SettingsPage({ settings, onChange }: SettingsPageProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-[28px] bg-white/80 p-5 shadow-bubble">
        <p className="text-sm font-semibold text-ink/60">分级听力难度</p>
        <p className="mt-2 text-xl font-bold text-ink">基础</p>
        <p className="mt-2 text-sm leading-6 text-ink/70">已合并入门和基础，当前统一使用完整句库练习。</p>
      </div>

      <div className="rounded-[28px] bg-white/80 p-5 shadow-bubble">
        <p className="text-sm font-semibold text-ink/60">跟读练习难度</p>
        <p className="mt-2 text-xl font-bold text-ink">基础</p>
        <p className="mt-2 text-sm leading-6 text-ink/70">跟读页也跟随统一难度，直接使用完整句库。</p>
      </div>

      <div className="rounded-[28px] bg-white/80 p-5 shadow-bubble">
        <p className="text-sm font-semibold text-ink/60">日常短句难度</p>
        <p className="mt-2 text-xl font-bold text-ink">基础</p>
        <p className="mt-2 text-sm leading-6 text-ink/70">推荐和分类短句都会从 88 句完整内容中生成。</p>
      </div>

      <SettingSelect
        label="看图识词分类"
        value={settings.selectedWordCategory}
        onChange={(value) => onChange({ ...settings, selectedWordCategory: value as SettingsState["selectedWordCategory"] })}
      >
        {Object.entries(wordCategoryLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </SettingSelect>

      <SettingSelect
        label="发音偏好"
        value={settings.accent}
        onChange={(value) => onChange({ ...settings, accent: value as SettingsState["accent"] })}
      >
        <option value="american">美式发音</option>
        <option value="british">英式发音</option>
      </SettingSelect>

      <SettingSelect
        label="单次动画观看时长"
        value={settings.maxVideoMinutes}
        onChange={(value) => onChange({ ...settings, maxVideoMinutes: Number(value) as SettingsState["maxVideoMinutes"] })}
      >
        <option value="5">5 分钟</option>
        <option value="10">10 分钟</option>
        <option value="15">15 分钟</option>
      </SettingSelect>

      <div className="sm:col-span-2 rounded-[28px] bg-white/80 p-5 text-sm leading-6 text-ink/75 shadow-bubble">
        这是一版精简设置页，只保留真正会影响孩子学习体验的项目。设置会自动保存在本机，刷新页面后也不会丢。
      </div>
    </div>
  );
}
