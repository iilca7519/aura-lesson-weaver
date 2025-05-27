
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Eye, EyeOff } from "lucide-react";

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

const ApiKeyInput = ({ onApiKeySet, currentApiKey }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState(currentApiKey || "");
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (apiKey.trim()) {
      onApiKeySet(apiKey.trim());
      localStorage.setItem('openai_api_key', apiKey.trim());
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          OpenAI API Configuration
        </CardTitle>
        <CardDescription>
          Enter your OpenAI API key to enable real AI lesson generation. Your key is stored locally and never shared.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            Save Key
          </Button>
        </div>
        {!currentApiKey && (
          <p className="text-sm text-gray-600">
            No API key configured. The system will use sample content until you provide a valid OpenAI API key.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;
