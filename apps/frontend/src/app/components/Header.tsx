import Logo from "./Logo";
import UserMenu from "./UserMenu";

export default function Header() {
    return (      
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Logo />
                        </div>
                        <div className="flex gap-4 ml-auto">
                            <UserMenu />
                        </div>
                    </div>
                </div>
            </header>
    );
}