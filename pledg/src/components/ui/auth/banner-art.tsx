import Image from "next/image";
import { cn } from "@/lib/utils";

export default function BannerArt(
    {
        className,
        widthPercent = 42,
        mainText = "Pledg", subTextComponent = <><span className="font-semibold">Borrowing</span> has never been this <span className="font-semibold">easier.</span></>,
        subPartAHeader = "Get Access", subPartAComponent = <>Email us at <a href="mailto:getaccess@pledg.com" className="text-white font-semibold underline">getaccess@pledg.com</a> to be one of the first to access our platform.</>,
        subPartBHeader = "Questions?", subPartBComponent = <>Reach us at <a href="mailto:support@pledg.com" className="text-white font-semibold underline">support@pledg.com</a></>,
    }: {
        className?: string,
        widthPercent?: number,
        mainText?: string, subTextComponent?: React.ReactNode,
        subPartAHeader?: string, subPartAComponent?: React.ReactNode,
        subPartBHeader?: string, subPartBComponent?: React.ReactNode
    }
) {
  return (
    <div
    className={
        cn(`
            h-full relative flex items-center justify-center overflow-hidden rounded-xl
            w-[${widthPercent}%]
        `, className)}>
        <Image
        alt="Banner Art"
        src="/auth-banner-art.png"
        width={800}
        height={1200}
        className="h-full w-full object-cover rounded-lg transition-all duration-700 ease-in-out"
        />
        
        <div
        className="absolute inset-0 bg-black/30" />
        
        <Image
        src="/pledg.svg"
        alt="Pledg Logo"
        width={70}
        height={70}
        className="absolute top-4 left-4 rounded-md p-2 text-xl font-bold text-white"
        />
        
        <div
        className="absolute top-5 left-24 flex items-center justify-center">
            <p
            className="text-white text-[24px] font-bold">{mainText}</p>
        </div>

        <div
        className="absolute top-14 left-24 flex items-center justify-center">
            <p
            className="text-white text-sm font-light">
                {subTextComponent}
            </p>
        </div>

        <div
        className="absolute bottom-8 left-8 right-8 h-32 bg-gradient-radial from-white/10 via-white/5 to-transparent backdrop-blur-[1px] rounded-xl grid grid-cols-2 items-center px-4 py-4">
            
            <div className="flex flex-col gap-2 overflow-hidden">
                <div className="text-white text-[18px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                {subPartAHeader}
                </div>
                <div className="text-header/80 text-[14px] pr-4 overflow-hidden text-ellipsis">
                {subPartAComponent}
                </div>
            </div>

            <div className="flex flex-col gap-2 border-l border-header/10 pl-6 overflow-hidden">
                <div className="text-white text-[18px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                    {subPartBHeader}
                </div>
                <div className="text-header/80 text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                    {subPartBComponent}
                </div>
            </div>
        </div>
    </div>
);
}