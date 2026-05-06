import { Check } from '@/svg/Common';
import { memo, useMemo } from 'react';

interface PasswordStrengthProps {
  password?: string;
}

const PasswordStrength = memo(({ password = "" }: PasswordStrengthProps) => {
  const { level, text, color, textColor } = useMemo(() => {
    if (!password) return { level: 0, text: '', color: '', textColor: '' };
    
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { level: 1, text: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
    if (score <= 3) return { level: 2, text: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-500' };
    if (score <= 4) return { level: 3, text: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    return { level: 4, text: 'Strong', color: 'bg-green-500', textColor: 'text-green-500' };
  }, [password]);

  if (!password) return null;

  const requirements = [
    { met: password.length >= 8, text: "8+ chars" },
    { met: /[A-Z]/.test(password), text: "Uppercase" },
    { met: /[a-z]/.test(password), text: "Lowercase" },
    { met: /[0-9]/.test(password), text: "Number" },
    { met: /[^A-Za-z0-9]/.test(password), text: "Special char" }
  ];

  return (
    <div className="flex flex-col gap-2 w-full px-1 mt-2 transition-all duration-300">
      
      {/* Header & Bars */}
      <div className="flex items-center justify-between text-[11px] font-medium px-1">
        <span className="text-zinc-500 dark:text-zinc-400">Password strength</span>
        <span className={textColor}>{text}</span>
      </div>
      
      <div className="flex gap-1.5 px-1">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              idx <= level ? color : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Badge Style Checklist */}
      <div className="flex flex-wrap gap-2 mt-1">
        {requirements.map((req, i) => (
          <div 
            key={i} 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all duration-300 ${
              req.met 
                ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400' 
                : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {req.met ? (
             <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              // Neutral Dot Icon
              <div className="w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
            )}
            {req.text}
          </div>
        ))}
      </div>
      
    </div>
  );
});

export default PasswordStrength;