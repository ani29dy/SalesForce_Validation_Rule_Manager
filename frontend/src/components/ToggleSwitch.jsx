export default function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={label}
      />
      <div
        className={`h-6 w-11 rounded-full transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-salesforce-blue peer-focus:ring-offset-2 ${
          disabled
            ? 'cursor-not-allowed bg-gray-200 opacity-50'
            : checked
              ? 'bg-green-500 peer-checked:bg-green-500'
              : 'bg-gray-300'
        }`}
      />
    </label>
  );
}
