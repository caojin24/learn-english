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
      <SettingSelect
        label="分级听力难度"
        value={settings.listeningDifficulty}
        onChange={(value) => onChange({ ...settings, listeningDifficulty: value as SettingsState["listeningDifficulty"] })}
      >
        <option value="starter">入门</option>
        <option value="basic">基础</option>
      </SettingSelect>

      <SettingSelect
        label="跟读练习难度"
        value={settings.speakingDifficulty}
        onChange={(value) => onChange({ ...settings, speakingDifficulty: value as SettingsState["speakingDifficulty"] })}
      >
        <option value="starter">入门</option>
        <option value="basic">基础</option>
      </SettingSelect>

      <SettingSelect
        label="日常短句难度"
        value={settings.phraseDifficulty}
        onChange={(value) => onChange({ ...settings, phraseDifficulty: value as SettingsState["phraseDifficulty"] })}
      >
        <option value="starter">入门</option>
        <option value="basic">基础</option>
      </SettingSelect>

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
