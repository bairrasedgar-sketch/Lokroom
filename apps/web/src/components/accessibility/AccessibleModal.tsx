"use client";

import { useEffect, useRef, ReactNode, KeyboardEvent, useState, useId } from "react";
import FocusTrap from "./FocusTrap";

/**
 * Accessible Modal Dialog component
 * WCAG 2.1 Level A - 2.4.3 Focus Order, 2.1.2 No Keyboard Trap
 */
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: AccessibleModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] h-[90vh]",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <FocusTrap active={isOpen}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-xl transform transition-all`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2
                id={titleId}
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
              {description && (
                <p
                  id={descriptionId}
                  className="mt-1 text-sm text-gray-500"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -m-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                aria-label="Fermer la modale"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}

/**
 * Accessible Dropdown Menu
 * WCAG 2.1 Level A - 2.1.1 Keyboard
 */
interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}

interface AccessibleDropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  label: string;
  align?: "left" | "right";
}

export function AccessibleDropdown({
  trigger,
  items,
  label,
  align = "left",
}: AccessibleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "Escape":
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setActiveIndex((prev) =>
          prev < items.filter(i => !i.disabled).length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : items.filter(i => !i.disabled).length - 1
        );
        break;
      case "Enter":
      case " ":
        if (isOpen && activeIndex >= 0) {
          e.preventDefault();
          const enabledItems = items.filter(i => !i.disabled);
          enabledItems[activeIndex]?.onClick?.();
          setIsOpen(false);
        } else if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        }
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={label}
        className="focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-lg"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={`absolute mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="py-1">
            {items.map((item) => {
              const enabledIndex = items.filter(i => !i.disabled).indexOf(item);
              const isActive = enabledIndex === activeIndex;

              if (item.href) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    role="menuitem"
                    tabIndex={-1}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                      item.disabled
                        ? "text-gray-400 cursor-not-allowed"
                        : isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    aria-disabled={item.disabled}
                  >
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    {item.label}
                  </a>
                );
              }

              return (
                <button
                  key={item.id}
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left ${
                    item.disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-disabled={item.disabled}
                >
                  {item.icon && <span aria-hidden="true">{item.icon}</span>}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Accessible Tabs component
 * WCAG 2.1 Level A - 2.1.1 Keyboard
 */
interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface AccessibleTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  ariaLabel?: string;
}

export function AccessibleTabs({
  tabs,
  defaultTab,
  onChange,
  ariaLabel = "Onglets",
}: AccessibleTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabledTabs = tabs.filter(t => !t.disabled);
    const currentIndex = enabledTabs.findIndex(t => t.id === activeTab);

    let newIndex = currentIndex;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1;
        break;
      case "ArrowRight":
        e.preventDefault();
        newIndex = currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = enabledTabs.length - 1;
        break;
      default:
        return;
    }

    const newTab = enabledTabs[newIndex];
    if (newTab) {
      setActiveTab(newTab.id);
      onChange?.(newTab.id);
      // Focus the new tab
      const tabElement = tabListRef.current?.querySelector(
        `[data-tab-id="${newTab.id}"]`
      ) as HTMLElement;
      tabElement?.focus();
    }
  };

  const handleTabClick = (tab: Tab) => {
    if (tab.disabled) return;
    setActiveTab(tab.id);
    onChange?.(tab.id);
  };

  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  return (
    <div>
      <div
        ref={tabListRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className="flex gap-1 border-b border-gray-200"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleTabClick(tab)}
            disabled={tab.disabled}
            className={`px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-inset ${
              activeTab === tab.id
                ? "border-b-2 border-gray-900 text-gray-900"
                : tab.disabled
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={tab.id}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className="pt-4 focus:outline-none"
        >
          {tab.id === activeTab && activeContent}
        </div>
      ))}
    </div>
  );
}
