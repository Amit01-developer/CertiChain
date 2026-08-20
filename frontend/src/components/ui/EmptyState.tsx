import { Link } from 'react-router-dom';

interface Props {
  icon:    React.ReactNode;
  title:   string;
  message: string;
  action?: { label: string; to: string };
}

export default function EmptyState({ icon, title, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-gray-300 mb-4">{icon}</div>
      <h3 className="font-serif text-xl text-brand-dark mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">{message}</p>
      {action && (
        <Link to={action.to} className="btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}
