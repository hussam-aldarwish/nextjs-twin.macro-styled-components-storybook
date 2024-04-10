'use client';
import tw from 'twin.macro';

interface ButtonProps {
  /**
   * Is this the principal call to action on the page?
   */
  primary?: boolean;
  /**
   * What background color to use
   */
  backgroundColor?: string;
  /**
   * How large should the button be?
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Button contents
   */
  label: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

const SIZES = {
  small: tw`py-2.5 px-4 text-xs`,
  medium: tw`px-5 py-3 text-sm`,
  large: tw`px-6 py-3 text-base`,
};

const COLORS = {
  primary: tw`text-white bg-[#1ea7fd]`,
  secondary: tw`bg-transparent text-gray-700 shadow-[rgba(0, 0, 0, 0.15) 0px 0px 0px 1px inset]`,
};

/**
 * Primary UI component for user interaction
 */
const Button = ({
  primary = false,
  size = 'medium',
  backgroundColor,
  label,
  ...props
}: ButtonProps) => {
  return (
    <button
      type="button"
      css={[
        tw`inline-block cursor-pointer border-0 font-bold leading-none rounded-[3em]`,
        primary ? COLORS.primary : COLORS.secondary,
        SIZES[size],
      ]}
      style={{ backgroundColor }}
      {...props}
    >
      {label}
    </button>
  );
};

export default Button;
