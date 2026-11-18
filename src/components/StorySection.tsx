import storyHandsImg from '../assets/images/story_craftsmanship_hands_1794997225001.jpg';
import { ResilientImage } from './ResilientImage.tsx';

export function StorySection() {
  return (
    <section id="cau-chuyen" className="bg-[#131B2E] text-[#FAF6EE] py-16 lg:py-24 border-y border-[#131B2E]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-5">
            <div className="h-full min-h-[320px] overflow-hidden rounded-lg border border-[#FAF6EE]/15">
              <ResilientImage
                src={storyHandsImg}
                alt="Đôi tay nghệ nhân Việt Nam đang tỉ mỉ thêu tay trên khung vải linen tại xưởng Đồ thêu Thanh Hà"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#E4B4B8] mb-3">
              Câu chuyện nghề thêu Thanh Hà
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-[#FAF6EE] mb-5">
              Từ khung thêu làng nghề đến nếp sống thanh lịch hôm nay
            </h2>
            <p className="text-base text-[#FAF6EE]/80 leading-relaxed mb-8">
              Lấy cảm hứng từ sắc đỏ đô trầm ấm của cánh sen, màu kem mộc của sợi đay sợi lanh và
              nét xanh đen sâu lắng của mực tàu, Đồ thêu Thanh Hà tạo nên những món đồ vải gần gũi:
              từ chiếc khăn vuông bỏ túi, khăn đặt ly bàn trà đến chiếc túi vải mang dấu ấn riêng.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#FAF6EE]/15">
              <div>
                <p className="font-serif text-lg font-semibold text-[#FAF6EE]">
                  01. Tuyển chọn vải mộc
                </p>
                <p className="text-sm text-[#FAF6EE]/75 mt-1.5 leading-relaxed">
                  Vải linen, cotton và lụa được giặt xử lý co rút kỹ trước khi căng khung.
                </p>
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-[#FAF6EE]">
                  02. Phác họa & Phối chỉ
                </p>
                <p className="text-sm text-[#FAF6EE]/75 mt-1.5 leading-relaxed">
                  Họa tiết hoa cỏ Việt Nam được vẽ tay và phối chỉ bền màu, hài hòa.
                </p>
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-[#FAF6EE]">
                  03. Thêu tay & Hoàn thiện
                </p>
                <p className="text-sm text-[#FAF6EE]/75 mt-1.5 leading-relaxed">
                  Đường thêu nổi khối tự nhiên, là ủi cẩn thận và kiểm duyệt trước khi trao tay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
