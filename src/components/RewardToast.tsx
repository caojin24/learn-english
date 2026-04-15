interface RewardToastProps {
  message: string;
}

export function RewardToast({ message }: RewardToastProps) {
  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="animate-pop rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-bubble sm:text-base">
        ⭐ {message}
      </div>
    </div>
  );
}
