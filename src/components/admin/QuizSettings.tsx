import { useState, useEffect } from "react";
import { Palette, Type, Link2, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface QuizSettingsData {
  // Appearance
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderRadius: "none" | "small" | "medium" | "large" | "full";
  
  // Texts
  startButtonText: string;
  nextButtonText: string;
  prevButtonText: string;
  submitButtonText: string;
  progressText: string;
  
  // Lead capture
  showLeadCapture: boolean;
  leadCapturePosition: "before_result" | "after_result";
  requiredFields: string[];
  
  // Redirect
  redirectAfterComplete: boolean;
  redirectUrl: string;
  redirectDelay: number;
  
  // Other
  showProgressBar: boolean;
  allowBackNavigation: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

const DEFAULT_SETTINGS: QuizSettingsData = {
  primaryColor: "#9b6b54",
  backgroundColor: "#ffffff",
  textColor: "#1a1a1a",
  accentColor: "#d4a574",
  borderRadius: "large",
  startButtonText: "Começar Quiz",
  nextButtonText: "Próximo",
  prevButtonText: "Anterior",
  submitButtonText: "Ver Resultado",
  progressText: "{current} de {total}",
  showLeadCapture: true,
  leadCapturePosition: "before_result",
  requiredFields: ["name", "phone"],
  redirectAfterComplete: false,
  redirectUrl: "",
  redirectDelay: 3,
  showProgressBar: true,
  allowBackNavigation: true,
  shuffleQuestions: false,
  shuffleOptions: false,
};

const COLOR_PRESETS = [
  { name: "Elegante", primary: "#9b6b54", accent: "#d4a574", bg: "#ffffff", text: "#1a1a1a" },
  { name: "Rosa", primary: "#e91e63", accent: "#f48fb1", bg: "#fff5f7", text: "#1a1a1a" },
  { name: "Azul", primary: "#2196f3", accent: "#64b5f6", bg: "#f5f9ff", text: "#1a1a1a" },
  { name: "Verde", primary: "#4caf50", accent: "#81c784", bg: "#f5fff5", text: "#1a1a1a" },
  { name: "Roxo", primary: "#9c27b0", accent: "#ba68c8", bg: "#fdf5ff", text: "#1a1a1a" },
  { name: "Escuro", primary: "#d4a574", accent: "#9b6b54", bg: "#1a1a1a", text: "#ffffff" },
];

interface QuizSettingsProps {
  settings: QuizSettingsData;
  onChange: (settings: QuizSettingsData) => void;
}

export function QuizSettings({ settings, onChange }: QuizSettingsProps) {
  const [localSettings, setLocalSettings] = useState<QuizSettingsData>({
    ...DEFAULT_SETTINGS,
    ...settings,
  });

  useEffect(() => {
    setLocalSettings({
      ...DEFAULT_SETTINGS,
      ...settings,
    });
  }, [settings]);

  function updateSetting<K extends keyof QuizSettingsData>(
    key: K,
    value: QuizSettingsData[K]
  ) {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onChange(newSettings);
  }

  function applyPreset(preset: typeof COLOR_PRESETS[0]) {
    const newSettings = {
      ...localSettings,
      primaryColor: preset.primary,
      accentColor: preset.accent,
      backgroundColor: preset.bg,
      textColor: preset.text,
    };
    setLocalSettings(newSettings);
    onChange(newSettings);
  }

  function resetToDefaults() {
    setLocalSettings(DEFAULT_SETTINGS);
    onChange(DEFAULT_SETTINGS);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Color Presets */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Cores</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetToDefaults}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Restaurar
            </Button>
          </div>
          <CardDescription className="text-xs">
            Escolha um preset ou personalize as cores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                  "hover:border-primary/50",
                  localSettings.primaryColor === preset.primary && 
                  localSettings.backgroundColor === preset.bg
                    ? "border-primary bg-primary/10"
                    : "border-border"
                )}
              >
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: preset.primary }}
                />
                {preset.name}
              </button>
            ))}
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Cor Principal</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localSettings.primaryColor}
                  onChange={(e) => updateSetting("primaryColor", e.target.value)}
                  className="w-10 h-9 rounded border cursor-pointer"
                />
                <Input
                  value={localSettings.primaryColor}
                  onChange={(e) => updateSetting("primaryColor", e.target.value)}
                  className="flex-1 h-9 text-xs font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor de Destaque</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localSettings.accentColor}
                  onChange={(e) => updateSetting("accentColor", e.target.value)}
                  className="w-10 h-9 rounded border cursor-pointer"
                />
                <Input
                  value={localSettings.accentColor}
                  onChange={(e) => updateSetting("accentColor", e.target.value)}
                  className="flex-1 h-9 text-xs font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor de Fundo</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localSettings.backgroundColor}
                  onChange={(e) => updateSetting("backgroundColor", e.target.value)}
                  className="w-10 h-9 rounded border cursor-pointer"
                />
                <Input
                  value={localSettings.backgroundColor}
                  onChange={(e) => updateSetting("backgroundColor", e.target.value)}
                  className="flex-1 h-9 text-xs font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cor do Texto</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localSettings.textColor}
                  onChange={(e) => updateSetting("textColor", e.target.value)}
                  className="w-10 h-9 rounded border cursor-pointer"
                />
                <Input
                  value={localSettings.textColor}
                  onChange={(e) => updateSetting("textColor", e.target.value)}
                  className="flex-1 h-9 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <Label className="text-xs">Arredondamento</Label>
            <div className="flex gap-2">
              {(["none", "small", "medium", "large", "full"] as const).map((radius) => (
                <button
                  key={radius}
                  onClick={() => updateSetting("borderRadius", radius)}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium border transition-all",
                    radius === "none" && "rounded-none",
                    radius === "small" && "rounded-sm",
                    radius === "medium" && "rounded-md",
                    radius === "large" && "rounded-lg",
                    radius === "full" && "rounded-full",
                    localSettings.borderRadius === radius
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {radius === "none" ? "Nenhum" : 
                   radius === "small" ? "Pequeno" : 
                   radius === "medium" ? "Médio" : 
                   radius === "large" ? "Grande" : "Total"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Texts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Textos dos Botões</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Botão Iniciar</Label>
              <Input
                value={localSettings.startButtonText}
                onChange={(e) => updateSetting("startButtonText", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Botão Próximo</Label>
              <Input
                value={localSettings.nextButtonText}
                onChange={(e) => updateSetting("nextButtonText", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Botão Anterior</Label>
              <Input
                value={localSettings.prevButtonText}
                onChange={(e) => updateSetting("prevButtonText", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Botão Ver Resultado</Label>
              <Input
                value={localSettings.submitButtonText}
                onChange={(e) => updateSetting("submitButtonText", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Texto do Progresso</Label>
            <Input
              value={localSettings.progressText}
              onChange={(e) => updateSetting("progressText", e.target.value)}
              placeholder="{current} de {total}"
              className="h-9 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use {`{current}`} e {`{total}`} para números dinâmicos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Redirect */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Redirecionamento</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Configure para onde o usuário vai após completar o quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Redirecionar após completar</Label>
              <p className="text-xs text-muted-foreground">
                Envia o usuário para outra página automaticamente
              </p>
            </div>
            <Switch
              checked={localSettings.redirectAfterComplete}
              onCheckedChange={(checked) => updateSetting("redirectAfterComplete", checked)}
            />
          </div>

          {localSettings.redirectAfterComplete && (
            <>
              <div className="space-y-2">
                <Label className="text-xs">URL de Redirecionamento</Label>
                <Input
                  value={localSettings.redirectUrl}
                  onChange={(e) => updateSetting("redirectUrl", e.target.value)}
                  placeholder="https://exemplo.com/obrigado"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Delay (segundos)</Label>
                <Select
                  value={String(localSettings.redirectDelay)}
                  onValueChange={(value) => updateSetting("redirectDelay", parseInt(value))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Imediato</SelectItem>
                    <SelectItem value="2">2 segundos</SelectItem>
                    <SelectItem value="3">3 segundos</SelectItem>
                    <SelectItem value="5">5 segundos</SelectItem>
                    <SelectItem value="10">10 segundos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Behavior */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Comportamento</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Mostrar barra de progresso</Label>
            </div>
            <Switch
              checked={localSettings.showProgressBar}
              onCheckedChange={(checked) => updateSetting("showProgressBar", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Permitir voltar</Label>
              <p className="text-xs text-muted-foreground">
                Usuário pode voltar para perguntas anteriores
              </p>
            </div>
            <Switch
              checked={localSettings.allowBackNavigation}
              onCheckedChange={(checked) => updateSetting("allowBackNavigation", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Embaralhar perguntas</Label>
            </div>
            <Switch
              checked={localSettings.shuffleQuestions}
              onCheckedChange={(checked) => updateSetting("shuffleQuestions", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Embaralhar opções</Label>
            </div>
            <Switch
              checked={localSettings.shuffleOptions}
              onCheckedChange={(checked) => updateSetting("shuffleOptions", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lead Capture */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Captura de Leads</CardTitle>
          <CardDescription className="text-xs">
            Configure quais dados coletar do usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Coletar dados do usuário</Label>
            </div>
            <Switch
              checked={localSettings.showLeadCapture}
              onCheckedChange={(checked) => updateSetting("showLeadCapture", checked)}
            />
          </div>

          {localSettings.showLeadCapture && (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Quando mostrar formulário</Label>
                <Select
                  value={localSettings.leadCapturePosition}
                  onValueChange={(value) => updateSetting("leadCapturePosition", value as "before_result" | "after_result")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before_result">Antes do resultado</SelectItem>
                    <SelectItem value="after_result">Depois do resultado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Campos obrigatórios</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "name", label: "Nome" },
                    { id: "email", label: "E-mail" },
                    { id: "phone", label: "Telefone" },
                    { id: "instagram", label: "Instagram" },
                  ].map((field) => (
                    <button
                      key={field.id}
                      onClick={() => {
                        const fields = localSettings.requiredFields || [];
                        const newFields = fields.includes(field.id)
                          ? fields.filter((f) => f !== field.id)
                          : [...fields, field.id];
                        updateSetting("requiredFields", newFields);
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                        (localSettings.requiredFields || []).includes(field.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { DEFAULT_SETTINGS };
