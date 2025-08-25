import { XMarkIcon } from '@heroicons/react/24/outline'
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/solid'

const Alert = ({
    type = 'info',
    title,
    message,
    onClose,
    className = '',
    actions
}) => {
    const icons = {
        success: CheckCircleIcon,
        warning: ExclamationTriangleIcon,
        error: XCircleIcon,
        info: InformationCircleIcon
    }

    const styles = {
        success: 'bg-success-50 text-success-800 border-success-200',
        warning: 'bg-warning-50 text-warning-800 border-warning-200',
        error: 'bg-danger-50 text-danger-800 border-danger-200',
        info: 'bg-primary-50 text-primary-800 border-primary-200'
    }

    const iconStyles = {
        success: 'text-success-400',
        warning: 'text-warning-400',
        error: 'text-danger-400',
        info: 'text-primary-400'
    }

    const Icon = icons[type]

    return (
        <div className={`rounded-md border p-4 ${styles[type]} ${className}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${iconStyles[type]}`} />
                </div>
                <div className="ml-3 flex-1">
                    {title && (
                        <h3 className="text-sm font-medium">
                            {title}
                        </h3>
                    )}
                    {message && (
                        <div className={`text-sm ${title ? 'mt-1' : ''}`}>
                            {message}
                        </div>
                    )}
                    {actions && (
                        <div className="mt-3 flex gap-2">
                            {actions}
                        </div>
                    )}
                </div>
                {onClose && (
                    <div className="ml-auto pl-3">
                        <button
                            onClick={onClose}
                            className="inline-flex rounded-md p-1.5 text-current hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 focus:ring-offset-current"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Alert